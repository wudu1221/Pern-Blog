const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); 

const router = express.Router();

// 1. Checkout initialization (Highly protected - Publisher Only)
router.post('/checkout', protect, restrictTo('publisher'), paymentController.initializeCheckout);

// 2. Chapa External Webhook (Left completely public so Chapa can ping it from the cloud)
router.post('/webhook', paymentController.verifyWebhook);

// 3. Frontend Dashboard Verification
router.post('/verify', protect, paymentController.verifyWebhook);

// 4. Fetch Ledger Invoices (Protected - Publisher Only)
router.get('/billing-history', protect, restrictTo('publisher'), paymentController.getBillingHistory);

// 5. Global Revenue Tracking Ledger (Protected - Admin Only)
// 💡 Note: If this file is mounted under your admin route group inside server.js, map this path to match your layout.
router.get('/admin-ledger', protect, restrictTo('admin'), paymentController.getAdminPaymentsLedger);

module.exports = router;