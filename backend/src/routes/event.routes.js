const router = require('express').Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middleware/auth');
const { tenantResolver } = require('../middleware/tenantResolver');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const { validate, createEventSchema, updateEventStatusSchema } = require('../middleware/validator');

// Public route — no auth, just tenant context
router.post('/public-book', tenantResolver, eventController.publicBook);

router.use(auth);

router.get('/', eventController.list);
router.get('/search-customers', eventController.searchCustomers);
router.post('/', eventController.create);
router.put('/:id', eventController.update);
router.patch('/:id/status', requirePermission(PERMISSIONS.APPROVE_EVENT), validate(updateEventStatusSchema), eventController.updateStatus);

module.exports = router;
