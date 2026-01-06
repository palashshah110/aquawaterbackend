const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('../config/db');

// Import error handlers
const { errorHandler, notFoundHandler } = require('../middlewares/errorHandler');

// Import routes
const productRoutes = require('../routes/productRoutes.js');
const orderRoutes = require('../routes/orderRoutes.js');
const bannerRoutes = require('../routes/bannerRoutes.js');
const categoryRoutes = require('../routes/categoryRoutes.js');
const shiprocketRoutes = require('../routes/shiprocketRoutes.js');
const articleRoutes = require('../routes/articleRoutes.js');
const userRoutes = require('../routes/userRoutes.js');
const contactRoutes = require('../routes/contactRoutes.js');

// Initialize express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for payment routes
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many payment requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors());

// Apply general rate limiting to all requests
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ShreeFlow API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes with specific rate limiters
app.use('/api/auth', authLimiter, userRoutes);
app.use('/api/orders/create-razorpay-order', paymentLimiter);
app.use('/api/orders/verify-payment', paymentLimiter);

// Standard API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/shiprocket', shiprocketRoutes);
app.use('/api/contact', contactRoutes);

// Razorpay key route (for frontend)
app.get('/api/razorpay-key', (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;
