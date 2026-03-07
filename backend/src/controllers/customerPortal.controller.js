const { Customer, Distribution, Payment, Rate } = require('../models');
const ApiResponse = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Get customer dashboard — their own profile, outstanding, recent activity
 */
exports.dashboard = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer record not found');

    // Recent distributions (last 10)
    const recentDistributions = await Distribution.findAll({
      where: { customer_id: customer.id },
      order: [['distribution_date', 'DESC']],
      limit: 10,
    });

    // Recent payments (last 10)
    const recentPayments = await Payment.findAll({
      where: { customer_id: customer.id, status: 'completed' },
      order: [['payment_date', 'DESC']],
      limit: 10,
    });

    // Current rate
    const rate = await Rate.findOne({
      where: { plant_id: customer.plant_id, tenant_id: req.user.tenantId, status: 'active' },
      order: [['effective_from', 'DESC']],
    });

    // Totals
    const totalSupplied = await Distribution.sum('quantity', {
      where: { customer_id: customer.id },
    }) || 0;

    const totalPaid = await Payment.sum('amount', {
      where: { customer_id: customer.id, status: 'completed' },
    }) || 0;

    return ApiResponse.success(res, {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        outstanding_balance: customer.outstanding_balance,
        default_container_count: customer.default_container_count,
        custom_rate: customer.custom_rate,
      },
      rate: rate ? { rate_per_unit: rate.rate_per_unit, unit_type: rate.unit_type } : null,
      totals: {
        totalSupplied,
        totalPaid,
        outstanding: parseFloat(customer.outstanding_balance),
      },
      recentDistributions,
      recentPayments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all distributions for the logged-in customer
 */
exports.myDistributions = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer record not found');

    const { page = 1, limit = 30, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const where = { customer_id: customer.id };

    if (startDate && endDate) {
      where.distribution_date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Distribution.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['distribution_date', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payments for the logged-in customer
 */
exports.myPayments = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer record not found');

    const { page = 1, limit = 30, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const where = { customer_id: customer.id, status: 'completed' };

    if (startDate && endDate) {
      where.payment_date = { [Op.between]: [`${startDate}T00:00:00`, `${endDate}T23:59:59`] };
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['payment_date', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

/**
 * Customer makes a payment (full outstanding or partial)
 */
exports.makePayment = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { user_id: req.user.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer record not found');

    const { amount, payment_method } = req.body;
    if (!amount || Number(amount) <= 0) {
      return ApiResponse.badRequest(res, 'Amount must be positive');
    }
    if (!payment_method) {
      return ApiResponse.badRequest(res, 'Payment method is required');
    }

    const outstanding = parseFloat(customer.outstanding_balance);
    if (outstanding <= 0) {
      return ApiResponse.badRequest(res, 'No outstanding balance to pay');
    }

    const payAmount = Math.min(parseFloat(amount), outstanding);

    // Create payment record
    const payment = await Payment.create({
      tenant_id: req.user.tenantId,
      plant_id: customer.plant_id,
      customer_id: customer.id,
      amount: payAmount,
      payment_method,
      payment_type: 'distribution',
      collected_by: req.user.id, // self-payment
      status: 'completed',
      payment_date: new Date(),
    });

    // Update outstanding balance
    const newOutstanding = Math.max(0, outstanding - payAmount);
    await customer.update({ outstanding_balance: newOutstanding });

    return ApiResponse.created(res, {
      payment,
      newOutstanding,
    }, `Payment of ₹${payAmount} recorded successfully`);
  } catch (error) {
    next(error);
  }
};
