const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/donation.controller');

// Multer setup (memory storage; Cloudinary upload handled in controller)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

router.get('/', ctrl.getDonations);
router.post('/', restrictTo('donor'), upload.array('photos', 5), ctrl.createDonation);
router.get('/:id', ctrl.getDonation);
router.patch('/:id', restrictTo('donor', 'admin'), ctrl.updateDonation);
router.delete('/:id/cancel', restrictTo('donor', 'admin'), ctrl.cancelDonation);

module.exports = router;
