const { Salary, SalaryPayment, Employee, User } = require('../models');
const ApiResponse = require('../utils/response');
const { Op } = require('sequelize');

exports.list = async (req, res, next) => {
  try {
    const { month, status, plantId, employee_id } = req.query;
    const where = { tenant_id: req.user.tenantId };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;
    if (month) where.month = month;
    if (status) where.status = status;
    if (employee_id) where.employee_id = employee_id;

    const salaries = await Salary.findAll({
      where,
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'name', 'phone'] },
        { model: SalaryPayment, as: 'payments', order: [['payment_date', 'DESC']] },
      ],
      order: [['month', 'DESC'], ['created_at', 'DESC']],
    });

    return ApiResponse.success(res, salaries);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate salary entries for all active employees for a given month.
 */
exports.generate = async (req, res, next) => {
  try {
    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const { month } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return ApiResponse.badRequest(res, 'Valid month (YYYY-MM) is required');
    }

    const employees = await Employee.findAll({
      where: { tenant_id: req.user.tenantId, plant_id: plantId, status: 'active' },
    });

    if (employees.length === 0) {
      return ApiResponse.badRequest(res, 'No active employees found');
    }

    const existing = await Salary.findAll({
      where: { tenant_id: req.user.tenantId, plant_id: plantId, month },
      attributes: ['employee_id'],
    });
    const existingIds = new Set(existing.map((s) => s.employee_id));

    const created = [];
    for (const emp of employees) {
      if (existingIds.has(emp.id)) continue;
      if (!emp.salary || parseFloat(emp.salary) <= 0) continue;

      const salary = await Salary.create({
        tenant_id: req.user.tenantId,
        plant_id: plantId,
        employee_id: emp.id,
        month,
        salary_amount: emp.salary,
      });
      created.push(salary);
    }

    return ApiResponse.created(res, {
      generated: created.length,
      skipped: employees.length - created.length,
    }, `${created.length} salary entries generated for ${month}`);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const { employee_id, month, salary_amount } = req.body;

    const existing = await Salary.findOne({
      where: { employee_id, month, tenant_id: req.user.tenantId },
    });
    if (existing) {
      return ApiResponse.badRequest(res, 'Salary entry already exists for this employee and month');
    }

    const salary = await Salary.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      employee_id,
      month,
      salary_amount,
    });

    return ApiResponse.created(res, salary, 'Salary entry created');
  } catch (error) {
    next(error);
  }
};

/**
 * Record a salary payment (full or partial) — creates SalaryPayment record for tracking
 */
exports.recordPayment = async (req, res, next) => {
  try {
    const salary = await Salary.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name'] }],
    });
    if (!salary) return ApiResponse.notFound(res, 'Salary record not found');

    const { amount, payment_method, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      return ApiResponse.badRequest(res, 'Amount must be positive');
    }

    const remaining = parseFloat(salary.salary_amount) - parseFloat(salary.paid_amount);
    const payAmount = Math.min(parseFloat(amount), remaining);

    if (payAmount <= 0) {
      return ApiResponse.badRequest(res, 'Salary is already fully paid');
    }

    // Create payment record for tracking
    await SalaryPayment.create({
      tenant_id: req.user.tenantId,
      plant_id: salary.plant_id,
      salary_id: salary.id,
      employee_id: salary.employee_id,
      amount: payAmount,
      payment_method: payment_method || 'cash',
      notes: notes || null,
      paid_by: req.user.id,
    });

    // Update salary aggregate
    const newPaid = parseFloat(salary.paid_amount) + payAmount;
    const salaryAmount = parseFloat(salary.salary_amount);
    let status = 'partial';
    if (newPaid >= salaryAmount) status = 'paid';

    await salary.update({
      paid_amount: Math.min(newPaid, salaryAmount),
      status,
      payment_date: new Date(),
    });

    // Reload with payments
    await salary.reload({
      include: [
        { model: Employee, as: 'employee', attributes: ['id', 'name', 'phone'] },
        { model: SalaryPayment, as: 'payments' },
      ],
    });

    return ApiResponse.success(res, salary, `₹${payAmount} salary payment recorded`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history for a specific salary record
 */
exports.getPayments = async (req, res, next) => {
  try {
    const payments = await SalaryPayment.findAll({
      where: { salary_id: req.params.id, tenant_id: req.user.tenantId },
      include: [
        { model: User, as: 'paidByUser', attributes: ['id', 'name'] },
      ],
      order: [['payment_date', 'DESC']],
    });

    return ApiResponse.success(res, payments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get salary summary for a given month
 */
exports.summary = async (req, res, next) => {
  try {
    const { month } = req.query;
    const where = { tenant_id: req.user.tenantId };
    if (req.user.plantId) where.plant_id = req.user.plantId;
    if (month) where.month = month;

    const salaries = await Salary.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'phone'] }],
    });

    const totalSalary = salaries.reduce((s, r) => s + parseFloat(r.salary_amount), 0);
    const totalPaid = salaries.reduce((s, r) => s + parseFloat(r.paid_amount), 0);
    const totalPending = totalSalary - totalPaid;

    return ApiResponse.success(res, {
      totalEmployees: salaries.length,
      totalSalary,
      totalPaid,
      totalPending,
      counts: {
        paid: salaries.filter((s) => s.status === 'paid').length,
        partial: salaries.filter((s) => s.status === 'partial').length,
        pending: salaries.filter((s) => s.status === 'pending').length,
      },
      salaries,
    });
  } catch (error) {
    next(error);
  }
};
