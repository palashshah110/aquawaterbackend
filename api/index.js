const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('../config/db');

// Import routes
const productRoutes = require('../routes/productRoutes.js');
const orderRoutes = require('../routes/orderRoutes.js');
const bannerRoutes = require('../routes/bannerRoutes.js');
const categoryRoutes = require('../routes/categoryRoutes.js');
const shiprocketRoutes = require('../routes/shiprocketRoutes.js');
const userRoutes = require('../routes/userRoutes.js');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ShreeFlow API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shiprocket', shiprocketRoutes);
app.use('/api/auth', userRoutes);

// Razorpay key route (for frontend)
app.get('/api/razorpay-key', (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Export for Vercel serverless
module.exports = app;
