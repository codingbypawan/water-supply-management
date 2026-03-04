const router = require('express').Router();
const rateController = require('../controllers/rate.controller');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');

router.use(auth);

router.get('/current', rateController.getCurrent);
router.get('/', rateController.list);
router.post('/', requirePermission(PERMISSIONS.MANAGE_RATE), rateController.setRate);

module.exports = router;
