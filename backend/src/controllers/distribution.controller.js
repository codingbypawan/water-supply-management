const { Distribution, Customer, Rate, Employee } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, date, customerId, plantId } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenant_id: req.user.tenantId };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;
    if (date) where.distribution_date = date;
    if (customerId) where.customer_id = customerId;

    const { count, rows } = await Distribution.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['distribution_date', 'DESC'], ['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const { customer_id, quantity, distribution_date, payment_status } = req.body;

    // Validate customer belongs to same tenant
    const customer = await Customer.findOne({
      where: { id: customer_id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer not found');

    // Auto-fetch rate: customer custom_rate > plant active rate
    let ratePerUnit = customer.custom_rate ? parseFloat(customer.custom_rate) : null;
    if (!ratePerUnit) {
      const activeRate = await Rate.findOne({
        where: { plant_id: plantId, status: 'active' },
        order: [['effective_from', 'DESC']],
      });
      if (!activeRate) return ApiResponse.badRequest(res, 'No active rate configured for this plant');
      ratePerUnit = parseFloat(activeRate.rate_per_unit);
    }

    const totalAmount = parseFloat(quantity) * ratePerUnit;

    // Find employee record for current user
    let employeeId = null;
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ where: { user_id: req.user.id } });
      if (emp) employeeId = emp.id;
    }

    const distribution = await Distribution.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      customer_id,
      employee_id: employeeId,
      distribution_date: distribution_date || new Date().toISOString().split('T')[0],
      quantity,
      rate: ratePerUnit,
      total_amount: totalAmount,
      payment_status: payment_status || 'unpaid',
    });

    // Update outstanding balance
    if (payment_status !== 'paid') {
      const addAmount = payment_status === 'partial' ? totalAmount / 2 : totalAmount;
      await customer.update({
        outstanding_balance: parseFloat(customer.outstanding_balance) + addAmount,
      });
    }

    return ApiResponse.created(res, { ...distribution.toJSON(), rate: ratePerUnit, total_amount: totalAmount, customer: { id: customer.id, name: customer.name, phone: customer.phone } }, 'Distribution recorded');
  } catch (error) {
    next(error);
  }
};

exports.dailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const where = {
      tenant_id: req.user.tenantId,
      distribution_date: targetDate,
    };
    if (req.user.plantId) where.plant_id = req.user.plantId;

    const distributions = await Distribution.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const summary = {
      date: targetDate,
      totalDistributions: distributions.length,
      totalQuantity: distributions.reduce((sum, d) => sum + parseFloat(d.quantity), 0),
      totalAmount: distributions.reduce((sum, d) => sum + parseFloat(d.total_amount), 0),
      paid: distributions.filter((d) => d.payment_status === 'paid').length,
      unpaid: distributions.filter((d) => d.payment_status === 'unpaid').length,
    };

    return ApiResponse.success(res, { summary, distributions });
  } catch (error) {
    next(error);
  }
};
