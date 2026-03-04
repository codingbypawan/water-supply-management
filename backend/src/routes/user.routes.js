const router = require('express').Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);

// List users — platform admin sees all, tenant/plant admin sees own tenant
router.get('/', requireRole(ROLES.PLATFORM_ADMIN, ROLES.TENANT_ADMIN, ROLES.PLANT_ADMIN), userController.list);

// Create user
router.post('/', requireRole(ROLES.PLATFORM_ADMIN, ROLES.TENANT_ADMIN), userController.create);

// Update user
router.put('/:id', requireRole(ROLES.PLATFORM_ADMIN, ROLES.TENANT_ADMIN), userController.update);

// Delete user
router.delete('/:id', requireRole(ROLES.PLATFORM_ADMIN, ROLES.TENANT_ADMIN), userController.deleteUser);

module.exports = router;
