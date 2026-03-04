const router = require('express').Router();
const salaryController = require('../controllers/salary.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);

router.get('/', salaryController.list);
router.get('/summary', salaryController.summary);
router.get('/:id/payments', salaryController.getPayments);
router.post('/', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), salaryController.create);
router.post('/generate', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), salaryController.generate);
router.patch('/:id/pay', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), salaryController.recordPayment);

module.exports = router;
