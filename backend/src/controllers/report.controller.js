const { Op, fn, col, literal } = require('sequelize');
const { Distribution, Payment, Customer, Event, Employee } = require('../models');
const ApiResponse = require('../utils/response');

exports.dailyDistribution = async (req, res, next) => {
  try {
    const { date, plantId } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const where = { tenant_id: req.user.tenantId, distribution_date: targetDate };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;

    const distributions = await Distribution.findAll({
      where,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
      order: [['created_at', 'DESC']],
    });

    const summary = {
      date: targetDate,
      total: distributions.length,
      totalQuantity: distributions.reduce((s, d) => s + parseFloat(d.quantity), 0),
      totalAmount: distributions.reduce((s, d) => s + parseFloat(d.total_amount), 0),
      paid: distributions.filter((d) => d.payment_status === 'paid').length,
      unpaid: distributions.filter((d) => d.payment_status === 'unpaid').length,
    };

    return ApiResponse.success(res, { summary, distributions });
  } catch (error) {
    next(error);
  }
};

exports.collection = async (req, res, next) => {
  try {
    const { startDate, endDate, plantId } = req.query;
    const where = { tenant_id: req.user.tenantId, status: 'completed' };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;
    if (startDate && endDate) {
      where.payment_date = { [Op.between]: [startDate, endDate] };
    }

    const payments = await Payment.findAll({
      where,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] }],
      order: [['payment_date', 'DESC']],
    });

    const summary = {
      totalCollected: payments.reduce((s, p) => s + parseFloat(p.amount), 0),
      totalTransactions: payments.length,
      byMethod: {
        cash: payments.filter((p) => p.payment_method === 'cash').reduce((s, p) => s + parseFloat(p.amount), 0),
        upi: payments.filter((p) => p.payment_method === 'upi').reduce((s, p) => s + parseFloat(p.amount), 0),
        bank: payments.filter((p) => p.payment_method === 'bank').reduce((s, p) => s + parseFloat(p.amount), 0),
        online: payments.filter((p) => p.payment_method === 'online').reduce((s, p) => s + parseFloat(p.amount), 0),
      },
    };

    return ApiResponse.success(res, { summary, payments });
  } catch (error) {
    next(error);
  }
};

exports.outstanding = async (req, res, next) => {
  try {
    const where = { tenant_id: req.user.tenantId, outstanding_balance: { [Op.gt]: 0 } };
    if (req.user.plantId) where.plant_id = req.user.plantId;

    const customers = await Customer.findAll({
      where,
      attributes: ['id', 'name', 'phone', 'outstanding_balance'],
      order: [['outstanding_balance', 'DESC']],
    });

    const total = customers.reduce((s, c) => s + parseFloat(c.outstanding_balance), 0);

    return ApiResponse.success(res, { totalOutstanding: total, count: customers.length, customers });
  } catch (error) {
    next(error);
  }
};

exports.revenue = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { tenant_id: req.user.tenantId, status: 'completed' };
    if (startDate && endDate) {
      where.payment_date = { [Op.between]: [startDate, endDate] };
    }

    const payments = await Payment.findAll({ where });
    const total = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

    return ApiResponse.success(res, {
      totalRevenue: total,
      transactionCount: payments.length,
    });
  } catch (error) {
    next(error);
  }
};
