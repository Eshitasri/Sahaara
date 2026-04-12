const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/delivery.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

router.get('/', ctrl.getDeliveries);
router.post('/', restrictTo('admin'), ctrl.createDelivery);
router.patch('/:id/accept', restrictTo('volunteer'), ctrl.acceptDelivery);
router.patch('/:id/pickup', restrictTo('volunteer'), upload.single('photo'), ctrl.confirmPickup);
router.patch('/:id/deliver', restrictTo('ngo'), upload.single('photo'), ctrl.confirmDelivery);

module.exports = router;
