const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { tenantResolver } = require('../middleware/tenantResolver');
const { validate, loginSchema } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/branding', tenantResolver, authController.getBranding);
router.get('/plants', authController.getPlantsList);
router.post('/login', authLimiter, tenantResolver, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', auth, authController.logout);
router.post('/change-password', auth, authController.changePassword);
router.get('/me', auth, authController.me);

module.exports = router;
