const { Payment, Customer } = require('../models');
const ApiResponse = require('../utils/response');
const { Op } = require('sequelize');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, customerId, plantId, method, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenant_id: req.user.tenantId };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;
    if (customerId) where.customer_id = customerId;
    if (method) where.payment_method = method;
    if (startDate && endDate) {
      where.payment_date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['payment_date', 'DESC']],
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

    const { customer_id, amount, payment_method, payment_type, distribution_id, event_id, transaction_ref } = req.body;

    // Validate customer
    const customer = await Customer.findOne({
      where: { id: customer_id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer not found');

    const payment = await Payment.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      customer_id,
      amount,
      payment_method,
      payment_type: payment_type || 'distribution',
      distribution_id,
      event_id,
      transaction_ref,
      collected_by: req.user.id,
      status: 'completed',
      payment_date: new Date(),
    });

    // Update outstanding balance
    const newOutstanding = Math.max(0, parseFloat(customer.outstanding_balance) - parseFloat(amount));
    await customer.update({ outstanding_balance: newOutstanding });

    return ApiResponse.created(res, payment, 'Payment recorded');
  } catch (error) {
    next(error);
  }
};

exports.outstandingReport = async (req, res, next) => {
  try {
    const where = { tenant_id: req.user.tenantId };
    if (req.user.plantId) where.plant_id = req.user.plantId;

    const customers = await Customer.findAll({
      where: {
        ...where,
        outstanding_balance: { [Op.gt]: 0 },
      },
      attributes: ['id', 'name', 'phone', 'outstanding_balance'],
      order: [['outstanding_balance', 'DESC']],
    });

    const total = customers.reduce((sum, c) => sum + parseFloat(c.outstanding_balance), 0);

    return ApiResponse.success(res, {
      totalOutstanding: total,
      customerCount: customers.length,
      customers,
    });
  } catch (error) {
    next(error);
  }
};
