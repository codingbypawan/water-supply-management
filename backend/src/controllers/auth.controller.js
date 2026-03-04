const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/environment');
const { User, Tenant, Plant, TenantConfig, PlantConfig, Employee, Customer } = require('../models');
const ApiResponse = require('../utils/response');

const generateTokens = (userId, tenantId, role) => {
  const accessToken = jwt.sign(
    { userId, tenantId, role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
  const refreshToken = jwt.sign(
    { userId, tenantId, role },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
  return { accessToken, refreshToken };
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password, tenantId, plantId } = req.body;

    // Determine tenant - from middleware or body
    const effectiveTenantId = req.tenantId || tenantId;

    if (!effectiveTenantId) {
      return ApiResponse.badRequest(res, 'Tenant could not be determined. Please select a plant.');
    }

    // Find user
    const user = await User.findOne({
      where: {
        phone,
        tenant_id: effectiveTenantId,
        status: 'active',
      },
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid phone number or password');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, 'Invalid phone number or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, effectiveTenantId, user.role);

    // Save refresh token
    user.refresh_token = refreshToken;
    user.last_login = new Date();
    await user.save();

    // Get tenant branding
    const tenant = await Tenant.findByPk(effectiveTenantId);

    // Get plant info if applicable
    let plant = null;
    if (user.plant_id) {
      plant = await Plant.findByPk(user.plant_id);
    } else if (plantId) {
      plant = await Plant.findByPk(plantId);
    }

    // Get employee permissions if role is employee
    let permissions = [];
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ where: { user_id: user.id } });
      if (employee) permissions = employee.permissions || [];
    }

    // Get customer info if role is customer
    let customerInfo = null;
    if (user.role === 'customer') {
      const cust = await Customer.findOne({ where: { user_id: user.id } });
      if (cust) {
        customerInfo = {
          customerId: cust.id,
          outstanding_balance: cust.outstanding_balance,
          default_container_count: cust.default_container_count,
        };
        // Ensure plantId is set from customer record
        if (!user.plant_id && cust.plant_id) {
          plant = await Plant.findByPk(cust.plant_id);
        }
      }
    }

    return ApiResponse.success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenant_id,
        plantId: user.plant_id,
        permissions,
        ...(customerInfo || {}),
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        tagline: tenant.tagline,
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
      } : null,
      plant: plant ? {
        id: plant.id,
        name: plant.name,
        logo_url: plant.logo_url,
        tagline: plant.tagline,
        primary_color: plant.primary_color,
        secondary_color: plant.secondary_color,
      } : null,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, 'Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);

    const user = await User.findOne({
      where: { id: decoded.userId, refresh_token: refreshToken, status: 'active' },
    });

    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid refresh token');
    }

    const tokens = generateTokens(user.id, user.tenant_id, user.role);

    user.refresh_token = tokens.refreshToken;
    await user.save();

    return ApiResponse.success(res, tokens, 'Token refreshed');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Refresh token expired, please login again');
    }
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await User.update(
      { refresh_token: null },
      { where: { id: req.user.id } }
    );
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change own password (requires current password)
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(res, 'Current password and new password are required');
    }
    if (newPassword.length < 6) {
      return ApiResponse.badRequest(res, 'New password must be at least 6 characters');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return ApiResponse.notFound(res, 'User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return ApiResponse.badRequest(res, 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: passwordHash });

    return ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'logo_url', 'primary_color', 'secondary_color'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'logo_url', 'primary_color', 'secondary_color'] },
      ],
    });

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Get branding by domain or slug
 * Public endpoint - no auth required
 */
exports.getBranding = async (req, res, next) => {
  try {
    const { domain, slug } = req.query;
    let tenant = null;

    if (domain) {
      tenant = await Tenant.findOne({
        where: { domain, status: 'active' },
        attributes: ['id', 'name', 'slug', 'logo_url', 'tagline', 'primary_color', 'secondary_color'],
      });
    }

    if (!tenant && slug) {
      tenant = await Tenant.findOne({
        where: { slug, status: 'active' },
        attributes: ['id', 'name', 'slug', 'logo_url', 'tagline', 'primary_color', 'secondary_color'],
      });
    }

    // Also try to resolve from hostname
    if (!tenant && req.hostname && req.hostname !== 'localhost') {
      const parts = req.hostname.split('.');
      if (parts.length > 1) {
        const subdomain = parts[0];
        tenant = await Tenant.findOne({
          where: { slug: subdomain, status: 'active' },
          attributes: ['id', 'name', 'slug', 'logo_url', 'tagline', 'primary_color', 'secondary_color'],
        });
      }
    }

    if (tenant) {
      // Also fetch plants for this tenant
      const plants = await Plant.findAll({
        where: { tenant_id: tenant.id, status: 'active' },
        attributes: ['id', 'name', 'logo_url', 'tagline', 'primary_color', 'secondary_color'],
      });

      return ApiResponse.success(res, { tenant, plants }, 'Branding loaded');
    }

    return ApiResponse.success(res, { tenant: null, plants: [] }, 'No branding found - use fallback');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tenants with their plants (for fallback plant selector)
 * Public endpoint
 */
exports.getPlantsList = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'slug', 'logo_url', 'tagline', 'primary_color', 'secondary_color'],
      include: [{
        model: Plant,
        as: 'plants',
        where: { status: 'active' },
        attributes: ['id', 'name', 'logo_url', 'tagline', 'primary_color', 'secondary_color'],
        required: false,
      }],
    });

    return ApiResponse.success(res, tenants, 'Plants list loaded');
  } catch (error) {
    next(error);
  }
};
