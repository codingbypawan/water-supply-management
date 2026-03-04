const router = require('express').Router();
const plantController = require('../controllers/plant.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);

router.get('/', plantController.list);
router.get('/:id', plantController.getById);
router.get('/:id/config', plantController.getConfig);

// Admin only
router.post('/', requireRole(ROLES.TENANT_ADMIN, ROLES.PLATFORM_ADMIN), plantController.create);
router.put('/:id', requireRole(ROLES.TENANT_ADMIN, ROLES.PLANT_ADMIN), plantController.update);
router.put('/:id/config', requireRole(ROLES.TENANT_ADMIN, ROLES.PLANT_ADMIN), plantController.updateConfig);

module.exports = router;
