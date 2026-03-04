const Joi = require('joi');
const ApiResponse = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const options = { abortEarly: false, stripUnknown: true };

    // Validate body, params, and query
    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.params) toValidate.params = req.params;
    if (schema.query) toValidate.query = req.query;

    for (const [key, value] of Object.entries(toValidate)) {
      const { error, value: validated } = schema[key].validate(value, options);
      if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return ApiResponse.badRequest(res, messages);
      }
      req[key] = validated;
    }

    next();
  };
};

// ── Auth Schemas ──
const loginSchema = {
  body: Joi.object({
    phone: Joi.string().required().min(10).max(15),
    password: Joi.string().required().min(6),
    tenantId: Joi.string().uuid(),
    plantId: Joi.string().uuid(),
  }),
};

// ── Customer Schemas ──
const createCustomerSchema = {
  body: Joi.object({
    name: Joi.string().required().max(255),
    phone: Joi.string().required().min(10).max(15),
    address: Joi.string().allow('', null),
    default_container_count: Joi.number().integer().min(1).default(1),
    plantId: Joi.string().uuid(),
  }),
};

// ── Distribution Schemas ──
const createDistributionSchema = {
  body: Joi.object({
    customer_id: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    rate: Joi.number().positive().optional(),
    distribution_date: Joi.date().default(() => new Date()),
    payment_status: Joi.string().valid('paid', 'unpaid', 'partial').default('unpaid'),
  }),
};

// ── Payment Schemas ──
const createPaymentSchema = {
  body: Joi.object({
    customer_id: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    payment_method: Joi.string().valid('cash', 'upi', 'bank', 'online').required(),
    payment_type: Joi.string().valid('distribution', 'event', 'advance').default('distribution'),
    distribution_id: Joi.string().uuid().allow(null),
    event_id: Joi.string().uuid().allow(null),
    transaction_ref: Joi.string().allow('', null),
  }),
};

// ── Event Schemas ──
const createEventSchema = {
  body: Joi.object({
    customer_id: Joi.string().uuid().required(),
    event_date: Joi.date().required(),
    container_count: Joi.number().integer().positive().required(),
    address: Joi.string().allow('', null),
    comment: Joi.string().allow('', null),
  }),
};

const updateEventStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid('pending', 'contacted', 'approved', 'rejected', 'completed', 'cancelled').required(),
    rate: Joi.number().positive(),
    payment_status: Joi.string().valid('paid', 'unpaid', 'partial'),
  }),
};

module.exports = {
  validate,
  loginSchema,
  createCustomerSchema,
  createDistributionSchema,
  createPaymentSchema,
  createEventSchema,
  updateEventStatusSchema,
};
