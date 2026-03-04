const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Tenant, Plant } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status, tenant_id } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Platform admin sees all; tenant/plant admin sees own tenant
    if (req.user.role === 'platform_admin') {
      if (tenant_id) where.tenant_id = tenant_id;
    } else {
      where.tenant_id = req.user.tenantId;
    }

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.paginated(res, rows, page, limit, count);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, password, role, tenant_id, plant_id } = req.body;

    // Determine tenant
    const tenantId = req.user.role === 'platform_admin' && tenant_id
      ? tenant_id
      : req.user.tenantId;

    if (!tenantId) {
      return ApiResponse.badRequest(res, 'Tenant ID is required');
    }

    // Check duplicate phone within tenant
    const existing = await User.findOne({ where: { phone, tenant_id: tenantId } });
    if (existing) {
      return ApiResponse.badRequest(res, 'A user with this phone number already exists in this tenant');
    }

    const passwordHash = await bcrypt.hash(password || phone, 12);
    const user = await User.create({
      name,
      phone,
      password_hash: passwordHash,
      role: role || 'employee',
      tenant_id: tenantId,
      plant_id: plant_id || null,
    });

    // Return without sensitive fields
    const { password_hash, refresh_token, ...userData } = user.toJSON();
    return ApiResponse.created(res, userData, 'User created successfully');
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');

    // Ensure tenant scope
    if (req.user.role !== 'platform_admin' && user.tenant_id !== req.user.tenantId) {
      return ApiResponse.forbidden(res, 'Cannot modify users outside your tenant');
    }

    const { name, phone, role, status, plant_id, password } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (plant_id !== undefined) updates.plant_id = plant_id || null;
    if (password) updates.password_hash = await bcrypt.hash(password, 12);

    await user.update(updates);

    const { password_hash, refresh_token, ...userData } = user.toJSON();
    return ApiResponse.success(res, userData, 'User updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');

    if (req.user.role !== 'platform_admin' && user.tenant_id !== req.user.tenantId) {
      return ApiResponse.forbidden(res, 'Cannot delete users outside your tenant');
    }

    // Don't allow deleting yourself
    if (user.id === req.user.id) {
      return ApiResponse.badRequest(res, 'Cannot delete your own account');
    }

    await user.destroy();
    return ApiResponse.success(res, null, 'User deleted');
  } catch (error) {
    next(error);
  }
};
