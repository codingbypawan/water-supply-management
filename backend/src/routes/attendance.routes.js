const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);

router.get('/', ctrl.list);
router.get('/summary', ctrl.summary);
router.post('/mark', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), ctrl.mark);

module.exports = router;
