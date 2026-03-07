const router = require('express').Router();
const pwaController = require('../controllers/pwa.controller');
const auth = require('../middleware/auth');

// Dynamic Web App Manifest (no auth required)
router.get('/manifest', pwaController.getManifest);

// Dynamic icon generation (no auth required)
router.get('/icon/:size', pwaController.getIcon);

// VAPID public key (no auth required)
router.get('/vapid-public-key', pwaController.getVapidPublicKey);

// Push subscription management (auth required)
router.post('/push-subscribe', auth, pwaController.pushSubscribe);
router.post('/push-unsubscribe', auth, pwaController.pushUnsubscribe);

module.exports = router;
