const { Event, Customer } = require('../models');
const { Op } = require('sequelize');
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

    // Map model fields to frontend-expected field names
    const mapped = rows.map((r) => {
      const plain = r.toJSON();
      plain.containers_needed = plain.container_count;
      plain.location = plain.address;
      plain.notes = plain.comment;
      plain.rate_per_unit = plain.rate;
      // event_rate is already on the model
      return plain;
    });

    return ApiResponse.paginated(res, mapped, page, limit, count);
  } catch (error) {
    next(error);
  }
};

exports.searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return ApiResponse.success(res, []);

    const where = { tenant_id: req.user.tenantId };
    if (req.user.plantId) where.plant_id = req.user.plantId;
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { phone: { [Op.like]: `%${q}%` } },
    ];

    const customers = await Customer.findAll({
      where,
      attributes: ['id', 'name', 'phone', 'address'],
      limit: 15,
      order: [['name', 'ASC']],
    });

    return ApiResponse.success(res, customers);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const {
      customer_id, event_type, event_date,
      // Accept both frontend and model field names
      containers_needed, container_count,
      rate_per_unit, rate, event_rate,
      location, address,
      notes, comment,
    } = req.body;

    const event = await Event.create({
      customer_id,
      event_type: event_type || 'other',
      event_date,
      container_count: containers_needed || container_count || null,
      rate: rate_per_unit || rate || null,
      event_rate: event_rate || null,
      total_amount: event_rate
        ? event_rate
        : (containers_needed || container_count) && (rate_per_unit || rate)
          ? (containers_needed || container_count) * (rate_per_unit || rate)
          : null,
      address: location || address || null,
      comment: notes || comment || null,
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

    const { status, rate, event_rate, payment_status } = req.body;
    const updateData = { status };

    if (event_rate !== undefined && event_rate !== null) {
      updateData.event_rate = event_rate;
      updateData.total_amount = event_rate;
    } else if (rate) {
      updateData.rate = rate;
      updateData.event_rate = rate;
      updateData.total_amount = rate;
    }
    if (payment_status) updateData.payment_status = payment_status;
    if (status === 'approved') updateData.approved_by = req.user.id;

    await event.update(updateData);
    return ApiResponse.success(res, event, 'Event status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * Public event booking — no auth required, only tenant context.
 * If mobile matches existing customer, link to them; otherwise create new customer.
 */
exports.publicBook = async (req, res, next) => {
  try {
    const { name, phone, address, event_date, event_type, notes } = req.body;

    if (!name || !phone || !event_date) {
      return ApiResponse.badRequest(res, 'Name, phone and event date are required');
    }

    const tenantId = req.tenantId;
    if (!tenantId) {
      return ApiResponse.badRequest(res, 'Could not determine tenant. Please try again.');
    }

    // Find the plant — use plantId from query/header or first plant of tenant
    const { Plant } = require('../models');
    let plantId = req.query.plantId || req.headers['x-plant-id'];
    if (!plantId) {
      const plant = await Plant.findOne({ where: { tenant_id: tenantId, status: 'active' } });
      if (!plant) return ApiResponse.badRequest(res, 'No active plant found for this tenant');
      plantId = plant.id;
    }

    // Check if customer exists by phone in this tenant + plant
    let customer = await Customer.findOne({
      where: { phone, tenant_id: tenantId, plant_id: plantId },
    });

    if (!customer) {
      // Create new customer
      customer = await Customer.create({
        name,
        phone,
        address: address || null,
        tenant_id: tenantId,
        plant_id: plantId,
        status: 'active',
        outstanding_balance: 0,
      });
    }

    // Create the event
    const event = await Event.create({
      customer_id: customer.id,
      customer_name: name,
      customer_phone: phone,
      event_type: event_type || 'other',
      event_date,
      address: address || null,
      comment: notes || null,
      tenant_id: tenantId,
      plant_id: plantId,
      status: 'pending',
    });

    return ApiResponse.created(res, {
      id: event.id,
      event_date: event.event_date,
      status: event.status,
      customer_name: name,
    }, 'Event booking request submitted! We will contact you shortly.');
  } catch (error) {
    next(error);
  }
};
