const router = require('express').Router();
const ctrl = require('../controllers/employeeReport.controller');
const auth = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');
const { PERMISSIONS, ROLES } = require('../utils/constants');

router.use(auth);

// ── Employee self-service (only needs auth + employee role) ──
router.get('/my-summary', requireRole(ROLES.EMPLOYEE), ctrl.mySummary);
router.get('/my-detail', requireRole(ROLES.EMPLOYEE), ctrl.myDetail);

// ── Admin endpoints (need VIEW_REPORT permission) ──
router.get('/employees', requirePermission(PERMISSIONS.VIEW_REPORT), ctrl.listEmployees);
router.get('/summary', requirePermission(PERMISSIONS.VIEW_REPORT), ctrl.employeeSummary);
router.get('/detail/:employeeId', requirePermission(PERMISSIONS.VIEW_REPORT), ctrl.employeeDetail);
router.post('/settlement', requirePermission(PERMISSIONS.VIEW_REPORT), ctrl.recordSettlement);

module.exports = router;
