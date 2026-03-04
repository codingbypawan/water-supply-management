const { Rate } = require('../models');
const ApiResponse = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Get current active rate for the user's plant
 */
exports.getCurrent = async (req, res, next) => {
  try {
    const plantId = req.query.plantId || req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const rate = await Rate.findOne({
      where: {
        plant_id: plantId,
        tenant_id: req.user.tenantId,
        status: 'active',
      },
      order: [['effective_from', 'DESC']],
    });

    return ApiResponse.success(res, rate);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all rates (history) for the plant
 */
exports.list = async (req, res, next) => {
  try {
    const plantId = req.query.plantId || req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const rates = await Rate.findAll({
      where: {
        plant_id: plantId,
        tenant_id: req.user.tenantId,
      },
      order: [['effective_from', 'DESC']],
    });

    return ApiResponse.success(res, rates);
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update the plant's default rate.
 * Deactivates old active rate and creates a new one.
 */
exports.setRate = async (req, res, next) => {
  try {
    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const { rate_per_unit, unit_type, effective_from } = req.body;
    if (!rate_per_unit || Number(rate_per_unit) <= 0) {
      return ApiResponse.badRequest(res, 'rate_per_unit is required and must be positive');
    }

    // Deactivate existing active rate
    await Rate.update(
      { status: 'inactive' },
      { where: { plant_id: plantId, tenant_id: req.user.tenantId, status: 'active' } }
    );

    // Create new rate
    const rate = await Rate.create({
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      rate_per_unit,
      unit_type: unit_type || 'container',
      effective_from: effective_from || new Date().toISOString().split('T')[0],
      status: 'active',
    });

    return ApiResponse.created(res, rate, 'Rate updated successfully');
  } catch (error) {
    next(error);
  }
};
