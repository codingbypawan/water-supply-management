const bcrypt = require('bcryptjs');
const { Tenant, TenantConfig, Plant, User, TenantSubscription, SubscriptionPlan } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      include: [
        { model: TenantConfig, as: 'config' },
        { model: Plant, as: 'plants' },
        { model: TenantSubscription, as: 'subscriptions', include: [{ model: SubscriptionPlan, as: 'plan' }] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    return ApiResponse.paginated(res, rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, slug, domain, logo_url, tagline, primary_color, secondary_color, adminName, adminPhone, adminPassword } = req.body;

    // Create tenant
    const tenant = await Tenant.create({
      name, slug, domain, logo_url, tagline, primary_color, secondary_color,
    });

    // Create tenant config with defaults
    await TenantConfig.create({ tenant_id: tenant.id });

    // Create tenant admin user if phone provided
    if (adminPhone) {
      const passwordHash = await bcrypt.hash(adminPassword || 'admin123', 12);
      await User.create({
        tenant_id: tenant.id,
        phone: adminPhone,
        password_hash: passwordHash,
        name: adminName || name + ' Admin',
        role: 'tenant_admin',
      });
    }

    return ApiResponse.created(res, tenant, 'Tenant created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: TenantConfig, as: 'config' },
        { model: Plant, as: 'plants' },
        { model: TenantSubscription, as: 'subscriptions', include: [{ model: SubscriptionPlan, as: 'plan' }] },
      ],
    });

    if (!tenant) return ApiResponse.notFound(res, 'Tenant not found');

    return ApiResponse.success(res, tenant);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return ApiResponse.notFound(res, 'Tenant not found');

    await tenant.update(req.body);
    return ApiResponse.success(res, tenant, 'Tenant updated');
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return ApiResponse.notFound(res, 'Tenant not found');

    await tenant.update({ status: req.body.status });
    return ApiResponse.success(res, tenant, 'Tenant status updated');
  } catch (error) {
    next(error);
  }
};
