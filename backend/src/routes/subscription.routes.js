const router = require('express').Router();
const subscriptionController = require('../controllers/subscription.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);

router.get('/plans', subscriptionController.listPlans);
router.get('/tenant/:tenantId?', subscriptionController.getTenantSubscription);

// Platform admin only
router.post('/plans', requireRole(ROLES.PLATFORM_ADMIN), subscriptionController.createPlan);
router.post('/subscribe', requireRole(ROLES.PLATFORM_ADMIN), subscriptionController.subscribeTenant);

module.exports = router;
