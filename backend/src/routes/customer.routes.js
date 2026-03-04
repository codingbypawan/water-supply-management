const router = require('express').Router();
const customerController = require('../controllers/customer.controller');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const { validate, createCustomerSchema } = require('../middleware/validator');

router.use(auth);

router.get('/', customerController.list);
router.get('/search', customerController.search);
router.get('/:id', customerController.getById);
router.get('/:id/ledger', customerController.getLedger);

router.post('/', requirePermission(PERMISSIONS.CREATE_CUSTOMER), validate(createCustomerSchema), customerController.create);
router.put('/:id', requirePermission(PERMISSIONS.UPDATE_CUSTOMER), customerController.update);
router.patch('/:id/rate', customerController.setRate);

module.exports = router;
