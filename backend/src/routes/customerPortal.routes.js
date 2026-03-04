const router = require('express').Router();
const portalController = require('../controllers/customerPortal.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);
router.use(requireRole(ROLES.CUSTOMER));

router.get('/dashboard', portalController.dashboard);
router.get('/distributions', portalController.myDistributions);
router.get('/payments', portalController.myPayments);
router.post('/pay', portalController.makePayment);

module.exports = router;
