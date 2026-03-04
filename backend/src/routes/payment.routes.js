const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const { validate, createPaymentSchema } = require('../middleware/validator');

router.use(auth);

router.get('/', paymentController.list);
router.get('/outstanding', paymentController.outstandingReport);
router.post('/', requirePermission(PERMISSIONS.COLLECT_PAYMENT), validate(createPaymentSchema), paymentController.create);

module.exports = router;
