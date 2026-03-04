const router = require('express').Router();
const employeeController = require('../controllers/employee.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);

router.get('/', employeeController.list);
router.post('/', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), employeeController.create);
router.put('/:id', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), employeeController.update);
router.put('/:id/permissions', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), employeeController.updatePermissions);
router.post('/:id/reset-password', requireRole(ROLES.PLANT_ADMIN, ROLES.TENANT_ADMIN), employeeController.resetPassword);

module.exports = router;
