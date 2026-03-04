const { SubscriptionPlan, TenantSubscription, Tenant } = require('../models');
const ApiResponse = require('../utils/response');

exports.listPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { status: 'active' },
      order: [['price_monthly', 'ASC']],
    });
    return ApiResponse.success(res, plans);
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    return ApiResponse.created(res, plan, 'Plan created');
  } catch (error) {
    next(error);
  }
};

exports.subscribeTenant = async (req, res, next) => {
  try {
    const { tenant_id, plan_id, start_date, end_date } = req.body;

    const subscription = await TenantSubscription.create({
      tenant_id,
      plan_id,
      start_date,
      end_date,
      status: 'active',
    });

    return ApiResponse.created(res, subscription, 'Subscription activated');
  } catch (error) {
    next(error);
  }
};

exports.getTenantSubscription = async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId || req.user.tenantId;

    const subscription = await TenantSubscription.findOne({
      where: { tenant_id: tenantId, status: 'active' },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
      order: [['created_at', 'DESC']],
    });

    return ApiResponse.success(res, subscription);
  } catch (error) {
    next(error);
  }
};
