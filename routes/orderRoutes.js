const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderStats,
  getRevenueChartData,
  getWeeklyOrdersChartData,
} = require('../controllers/orderController');

// Public routes
router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/verify-payment', verifyPaymentAndCreateOrder);
router.get('/track/:orderId', trackOrder);

// Admin routes (add authentication middleware in production)
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/chart/revenue', getRevenueChartData);
router.get('/chart/weekly', getWeeklyOrdersChartData);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
