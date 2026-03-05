const router = require('express').Router();
const pwaController = require('../controllers/pwa.controller');

// Dynamic Web App Manifest (no auth required)
router.get('/manifest', pwaController.getManifest);

// Dynamic icon generation (no auth required)
router.get('/icon/:size', pwaController.getIcon);

module.exports = router;
