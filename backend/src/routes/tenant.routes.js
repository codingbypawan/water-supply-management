const router = require('express').Router();
const tenantController = require('../controllers/tenant.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(auth);
router.use(requireRole(ROLES.PLATFORM_ADMIN));

router.get('/', tenantController.list);
router.post('/', tenantController.create);
router.get('/:id', tenantController.getById);
router.put('/:id', tenantController.update);
router.patch('/:id/status', tenantController.updateStatus);

module.exports = router;
