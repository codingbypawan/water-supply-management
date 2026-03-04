const { Event, Customer } = require('../models');
const ApiResponse = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, plantId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenant_id: req.user.tenantId };
    if (plantId) where.plant_id = plantId;
    else if (req.user.plantId) where.plant_id = req.user.plantId;
    if (status) where.status = status;
    if (startDate && endDate) {
      const { Op } = require('sequelize');
      where.event_date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['event_date', 'ASC']],
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

    const event = await Event.create({
      ...req.body,
      tenant_id: req.user.tenantId,
      plant_id: plantId,
      status: 'pending',
    });

    return ApiResponse.created(res, event, 'Event application submitted');
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!event) return ApiResponse.notFound(res, 'Event not found');

    await event.update(req.body);
    return ApiResponse.success(res, event, 'Event updated');
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenantId },
    });
    if (!event) return ApiResponse.notFound(res, 'Event not found');

    const { status, rate, payment_status } = req.body;
    const updateData = { status };

    if (rate) {
      updateData.rate = rate;
      updateData.total_amount = rate * event.container_count;
    }
    if (payment_status) updateData.payment_status = payment_status;
    if (status === 'approved') updateData.approved_by = req.user.id;

    await event.update(updateData);
    return ApiResponse.success(res, event, 'Event status updated');
  } catch (error) {
    next(error);
  }
};
