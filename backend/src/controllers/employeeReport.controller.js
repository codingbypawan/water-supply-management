const { Op, fn, col, literal } = require('sequelize');
const { Distribution, Payment, User, Employee, EmployeeSettlement, Customer } = require('../models');
const ApiResponse = require('../utils/response');

/**
 * Employee self-service: My summary — distributions, collections, cash in hand
 */
exports.mySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const empRecord = await Employee.findOne({ where: { user_id: userId } });
    const employeeId = empRecord ? empRecord.id : null;

    // Date filters
    const distDateWhere = {};
    const payDateWhere = {};
    const settleDateWhere = {};
    if (startDate && endDate) {
      distDateWhere.distribution_date = { [Op.between]: [startDate, endDate] };
      payDateWhere.payment_date = { [Op.between]: [`${startDate}T00:00:00`, `${endDate}T23:59:59`] };
      settleDateWhere.settlement_date = { [Op.between]: [startDate, endDate] };
    }

    // Distributions by this employee
    let distributionCount = 0, distributionAmount = 0, distributionQty = 0;
    if (employeeId) {
      const distributions = await Distribution.findAll({
        where: { tenant_id: tenantId, employee_id: employeeId, ...distDateWhere },
        attributes: ['quantity', 'total_amount'],
      });
      distributionCount = distributions.length;
      distributionAmount = distributions.reduce((s, d) => s + parseFloat(d.total_amount), 0);
      distributionQty = distributions.reduce((s, d) => s + parseFloat(d.quantity), 0);
    }

    // Payments collected by this employee
    const payments = await Payment.findAll({
      where: { tenant_id: tenantId, collected_by: userId, status: 'completed', ...payDateWhere },
      attributes: ['amount', 'payment_method'],
    });
    const collectionCount = payments.length;
    const collectionAmount = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const cashCollected = payments.filter(p => p.payment_method === 'cash')
      .reduce((s, p) => s + parseFloat(p.amount), 0);
    const upiCollected = payments.filter(p => p.payment_method === 'upi')
      .reduce((s, p) => s + parseFloat(p.amount), 0);
    const bankCollected = payments.filter(p => p.payment_method === 'bank' || p.payment_method === 'online')
      .reduce((s, p) => s + parseFloat(p.amount), 0);

    // Settlements (money given to admin)
    const settlements = await EmployeeSettlement.findAll({
      where: { tenant_id: tenantId, employee_user_id: userId, ...settleDateWhere },
      attributes: ['amount'],
    });
    const totalSettled = settlements.reduce((s, st) => s + parseFloat(st.amount), 0);

    const cashInHand = Math.max(0, cashCollected - totalSettled);

    return ApiResponse.success(res, {
      distributions: { count: distributionCount, quantity: distributionQty, amount: distributionAmount },
      collections: { count: collectionCount, amount: collectionAmount, cashCollected, upiCollected, bankCollected },
      settlements: { total: totalSettled },
      cashInHand,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Employee self-service: My detailed activity
 */
exports.myDetail = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;
    const tenantId = req.user.tenantId;
    const userId = req.user.id;

    const empRecord = await Employee.findOne({ where: { user_id: userId } });

    const distDateWhere = {};
    const payDateWhere = {};
    const settleDateWhere = {};
    if (startDate && endDate) {
      distDateWhere.distribution_date = { [Op.between]: [startDate, endDate] };
      payDateWhere.payment_date = { [Op.between]: [`${startDate}T00:00:00`, `${endDate}T23:59:59`] };
      settleDateWhere.settlement_date = { [Op.between]: [startDate, endDate] };
    }

    let distributions = [];
    let paymentsData = [];
    let settlementsData = [];

    if (!type || type === 'distributions') {
      if (empRecord) {
        distributions = await Distribution.findAll({
          where: { tenant_id: tenantId, employee_id: empRecord.id, ...distDateWhere },
          include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
          order: [['distribution_date', 'DESC']],
          limit: 100,
        });
      }
    }

    if (!type || type === 'collections') {
      paymentsData = await Payment.findAll({
        where: { tenant_id: tenantId, collected_by: userId, status: 'completed', ...payDateWhere },
        include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
        order: [['payment_date', 'DESC']],
        limit: 100,
      });
    }

    if (!type || type === 'settlements') {
      settlementsData = await EmployeeSettlement.findAll({
        where: { tenant_id: tenantId, employee_user_id: userId, ...settleDateWhere },
        include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }],
        order: [['settlement_date', 'DESC']],
        limit: 100,
      });
    }

    return ApiResponse.success(res, { distributions, payments: paymentsData, settlements: settlementsData });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of employees (users with role employee) for the current plant/tenant
 */
exports.listEmployees = async (req, res, next) => {
  try {
    const where = { role: 'employee', status: 'active' };
    if (req.user.tenantId) where.tenant_id = req.user.tenantId;
    if (req.user.plantId) where.plant_id = req.user.plantId;

    const employees = await User.findAll({
      where,
      attributes: ['id', 'name', 'phone', 'plant_id'],
      order: [['name', 'ASC']],
    });

    return ApiResponse.success(res, employees);
  } catch (error) {
    next(error);
  }
};

/**
 * Employee performance summary
 * Shows per-employee: distributions count & amount, collections count & amount,
 * total settled (given to admin), balance with employee
 */
exports.employeeSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, employee_id } = req.query;
    const tenantId = req.user.tenantId;
    const plantId = req.user.plantId;

    // Date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter[Op.between] = [startDate, endDate];
    }

    // Get employees
    const empWhere = { role: 'employee', status: 'active' };
    if (tenantId) empWhere.tenant_id = tenantId;
    if (plantId) empWhere.plant_id = plantId;
    if (employee_id) empWhere.id = employee_id;

    const employees = await User.findAll({
      where: empWhere,
      attributes: ['id', 'name', 'phone', 'plant_id'],
      order: [['name', 'ASC']],
    });

    const summaries = [];

    for (const emp of employees) {
      // Find employee record to get employee_id for distributions
      const empRecord = await Employee.findOne({ where: { user_id: emp.id } });
      const employeeId = empRecord ? empRecord.id : null;

      // Distributions by this employee
      const distWhere = {};
      if (tenantId) distWhere.tenant_id = tenantId;
      if (employeeId) distWhere.employee_id = employeeId;
      else distWhere.employee_id = null; // skip if no employee record — no distributions
      if (startDate && endDate) distWhere.distribution_date = { [Op.between]: [startDate, endDate] };

      let distributionCount = 0;
      let distributionAmount = 0;
      let distributionQty = 0;

      if (employeeId) {
        const distributions = await Distribution.findAll({
          where: distWhere,
          attributes: ['quantity', 'total_amount'],
        });
        distributionCount = distributions.length;
        distributionAmount = distributions.reduce((s, d) => s + parseFloat(d.total_amount), 0);
        distributionQty = distributions.reduce((s, d) => s + parseFloat(d.quantity), 0);
      }

      // Payments collected by this employee
      const payWhere = { collected_by: emp.id, status: 'completed' };
      if (tenantId) payWhere.tenant_id = tenantId;
      if (startDate && endDate) payWhere.payment_date = { [Op.between]: [`${startDate}T00:00:00`, `${endDate}T23:59:59`] };

      const payments = await Payment.findAll({
        where: payWhere,
        attributes: ['amount', 'payment_method'],
      });
      const collectionCount = payments.length;
      const collectionAmount = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
      const cashCollected = payments.filter(p => p.payment_method === 'cash')
        .reduce((s, p) => s + parseFloat(p.amount), 0);

      // Settlements (money given to admin)
      const settleWhere = { employee_user_id: emp.id };
      if (tenantId) settleWhere.tenant_id = tenantId;
      if (startDate && endDate) settleWhere.settlement_date = { [Op.between]: [startDate, endDate] };

      const settlements = await EmployeeSettlement.findAll({
        where: settleWhere,
        attributes: ['amount'],
      });
      const totalSettled = settlements.reduce((s, st) => s + parseFloat(st.amount), 0);

      // Cash balance with employee = cash collected - settled
      const cashWithEmployee = Math.max(0, cashCollected - totalSettled);

      summaries.push({
        employee: { id: emp.id, name: emp.name, phone: emp.phone },
        distributions: { count: distributionCount, quantity: distributionQty, amount: distributionAmount },
        collections: { count: collectionCount, amount: collectionAmount, cashCollected },
        settlements: { total: totalSettled },
        cashWithEmployee,
      });
    }

    // Totals
    const totals = {
      totalDistributions: summaries.reduce((s, e) => s + e.distributions.count, 0),
      totalDistributionAmount: summaries.reduce((s, e) => s + e.distributions.amount, 0),
      totalCollections: summaries.reduce((s, e) => s + e.collections.count, 0),
      totalCollectionAmount: summaries.reduce((s, e) => s + e.collections.amount, 0),
      totalSettled: summaries.reduce((s, e) => s + e.settlements.total, 0),
      totalCashWithEmployees: summaries.reduce((s, e) => s + e.cashWithEmployee, 0),
    };

    return ApiResponse.success(res, { totals, employees: summaries });
  } catch (error) {
    next(error);
  }
};

/**
 * Detailed employee activity — distributions and collections for a specific employee
 */
exports.employeeDetail = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const tenantId = req.user.tenantId;

    const empFindWhere = { id: employeeId };
    if (tenantId) empFindWhere.tenant_id = tenantId;
    const emp = await User.findOne({
      where: empFindWhere,
      attributes: ['id', 'name', 'phone'],
    });
    if (!emp) return ApiResponse.notFound(res, 'Employee not found');

    const empRecord = await Employee.findOne({ where: { user_id: emp.id } });

    // Distributions
    const distWhere = {};
    if (tenantId) distWhere.tenant_id = tenantId;
    if (empRecord) distWhere.employee_id = empRecord.id;
    else distWhere.employee_id = null;
    if (startDate && endDate) distWhere.distribution_date = { [Op.between]: [startDate, endDate] };

    const distributions = empRecord ? await Distribution.findAll({
      where: distWhere,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
      order: [['distribution_date', 'DESC']],
    }) : [];

    // Collections
    const payWhere = { collected_by: emp.id, status: 'completed' };
    if (tenantId) payWhere.tenant_id = tenantId;
    if (startDate && endDate) payWhere.payment_date = { [Op.between]: [`${startDate}T00:00:00`, `${endDate}T23:59:59`] };

    const payments = await Payment.findAll({
      where: payWhere,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
      order: [['payment_date', 'DESC']],
    });

    // Settlements
    const settleWhere = { employee_user_id: emp.id };
    if (tenantId) settleWhere.tenant_id = tenantId;
    if (startDate && endDate) settleWhere.settlement_date = { [Op.between]: [startDate, endDate] };

    const settlements = await EmployeeSettlement.findAll({
      where: settleWhere,
      include: [{ model: User, as: 'receiver', attributes: ['id', 'name'] }],
      order: [['settlement_date', 'DESC']],
    });

    return ApiResponse.success(res, {
      employee: emp,
      distributions,
      payments,
      settlements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record an employee settlement (money handed to admin)
 */
exports.recordSettlement = async (req, res, next) => {
  try {
    const { employee_user_id, amount, notes } = req.body;
    if (!employee_user_id || !amount) {
      return ApiResponse.badRequest(res, 'employee_user_id and amount are required');
    }

    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const emp = await User.findOne({
      where: { id: employee_user_id, tenant_id: req.user.tenantId, role: 'employee' },
    });
    if (!emp) return ApiResponse.notFound(res, 'Employee not found');

    const settlement = await EmployeeSettlement.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      employee_user_id,
      amount,
      settlement_date: new Date().toISOString().split('T')[0],
      received_by: req.user.id,
      notes,
    });

    return ApiResponse.created(res, settlement, 'Settlement recorded');
  } catch (error) {
    next(error);
  }
};
