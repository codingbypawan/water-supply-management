const router = require('express').Router();
const distributionController = require('../controllers/distribution.controller');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');
const { validate, createDistributionSchema } = require('../middleware/validator');

router.use(auth);

router.get('/', distributionController.list);
router.get('/daily', distributionController.dailyReport);
router.post('/', requirePermission(PERMISSIONS.DISTRIBUTE_WATER), validate(createDistributionSchema), distributionController.create);

module.exports = router;
