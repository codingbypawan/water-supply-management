const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Customer, Distribution, Payment, User } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, plantId } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenant_id: req.user.tenantId };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
    });

    return ApiResponse.paginated(res, rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const plantId = req.body.plantId || req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant ID required');

    const { name, phone } = req.body;

    // Auto-create a User account for the customer (password = phone number)
    let userId = null;
    const existingUser = await User.findOne({
      where: { phone, tenant_id: req.user.tenantId },
    });
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const passwordHash = await bcrypt.hash(phone, 12);
      const user = await User.create({
        tenant_id: req.user.tenantId,
        plant_id: plantId,
        phone,
        password_hash: passwordHash,
        name,
        role: 'customer',
      });
      userId = user.id;
    }

    const customer = await Customer.create({
      ...req.body,
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      user_id: userId,
    });

    return ApiResponse.created(res, customer, 'Customer created');
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer not found');
    return ApiResponse.success(res, customer);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer not found');

    await customer.update(req.body);
    return ApiResponse.success(res, customer, 'Customer updated');
  } catch (error) {
    next(error);
  }
};

exports.getLedger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const distributions = await Distribution.findAll({
      where: { customer_id: id, tenant_id: req.user.tenantId },
      order: [['distribution_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const payments = await Payment.findAll({
      where: { customer_id: id, tenant_id: req.user.tenantId, status: 'completed' },
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return ApiResponse.success(res, { distributions, payments });
  } catch (error) {
    next(error);
  }
};

// Quick search — returns max 20 matches (for autocomplete)
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return ApiResponse.success(res, []);

    const where = {
      tenant_id: req.user.tenantId,
      status: 'active',
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
      ],
    };
    if (req.user.plantId) where.plant_id = req.user.plantId;

    const rows = await Customer.findAll({
      where,
      attributes: ['id', 'name', 'phone', 'address', 'default_container_count', 'custom_rate', 'outstanding_balance'],
      limit: 20,
      order: [['name', 'ASC']],
    });

    return ApiResponse.success(res, rows);
  } catch (error) {
    next(error);
  }
};

// Set / update custom rate for a customer
exports.setRate = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!customer) return ApiResponse.notFound(res, 'Customer not found');

    const { custom_rate } = req.body;
    await customer.update({ custom_rate: custom_rate || null });

    return ApiResponse.success(res, customer, 'Rate updated');
  } catch (error) {
    next(error);
  }
};
