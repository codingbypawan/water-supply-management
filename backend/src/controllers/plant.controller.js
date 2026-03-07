const { Plant, PlantConfig, Rate } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const where = {};
    // Platform admin sees all plants; others see only their tenant's
    if (req.user.role === 'platform_admin') {
      if (req.query.tenant_id) where.tenant_id = req.query.tenant_id;
    } else {
      where.tenant_id = req.user.tenantId;
    }
    if (req.query.status) where.status = req.query.status;

    const plants = await Plant.findAll({
      where,
      include: [{ model: PlantConfig, as: 'config' }],
      order: [['name', 'ASC']],
    });

    return ApiResponse.success(res, plants);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const tenantId = req.user.role === 'platform_admin' && req.body.tenant_id
      ? req.body.tenant_id
      : req.user.tenantId;
    const plant = await Plant.create({
      ...req.body,
      tenant_id: tenantId,
    });

    // Create default config
    await PlantConfig.create({
      tenant_id: tenantId,
      plant_id: plant.id,
    });

    return ApiResponse.created(res, plant, 'Plant created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'platform_admin') where.tenant_id = req.user.tenantId;
    const plant = await Plant.findOne({
      where,
      include: [
        { model: PlantConfig, as: 'config' },
        { model: Rate, as: 'rates', where: { status: 'active' }, required: false },
      ],
    });

    if (!plant) return ApiResponse.notFound(res, 'Plant not found');
    return ApiResponse.success(res, plant);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'platform_admin') where.tenant_id = req.user.tenantId;
    const plant = await Plant.findOne({ where });
    if (!plant) return ApiResponse.notFound(res, 'Plant not found');

    await plant.update(req.body);
    return ApiResponse.success(res, plant, 'Plant updated');
  } catch (error) {
    next(error);
  }
};

exports.getConfig = async (req, res, next) => {
  try {
    const where = { plant_id: req.params.id };
    if (req.user.role !== 'platform_admin') where.tenant_id = req.user.tenantId;
    const config = await PlantConfig.findOne({ where });
    if (!config) return ApiResponse.notFound(res, 'Plant config not found');
    return ApiResponse.success(res, config);
  } catch (error) {
    next(error);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const where = { plant_id: req.params.id };
    if (req.user.role !== 'platform_admin') where.tenant_id = req.user.tenantId;
    const config = await PlantConfig.findOne({ where });
    if (!config) return ApiResponse.notFound(res, 'Plant config not found');

    await config.update(req.body);
    return ApiResponse.success(res, config, 'Plant config updated');
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'platform_admin') {
      where.tenant_id = req.user.tenantId;
    }
    const plant = await Plant.findOne({ where });
    if (!plant) return ApiResponse.notFound(res, 'Plant not found');

    await PlantConfig.destroy({ where: { plant_id: plant.id } });
    await plant.destroy();
    return ApiResponse.success(res, null, 'Plant deleted successfully');
  } catch (error) {
    next(error);
  }
};
