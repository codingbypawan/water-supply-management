const router = require('express').Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const { validate, createEventSchema, updateEventStatusSchema } = require('../middleware/validator');

router.use(auth);

router.get('/', eventController.list);
router.post('/', validate(createEventSchema), eventController.create);
router.put('/:id', eventController.update);
router.patch('/:id/status', requirePermission(PERMISSIONS.APPROVE_EVENT), validate(updateEventStatusSchema), eventController.updateStatus);

module.exports = router;
