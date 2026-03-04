const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../utils/constants');

router.use(auth);
router.use(requirePermission(PERMISSIONS.VIEW_REPORT));

router.get('/daily-distribution', reportController.dailyDistribution);
router.get('/collection', reportController.collection);
router.get('/outstanding', reportController.outstanding);
router.get('/revenue', reportController.revenue);

module.exports = router;
