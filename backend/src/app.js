const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { getDBStatus } = require('./config/db');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const referralRoutes = require('./routes/referralRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, postman) or matching CLIENT_URL
      if (!origin || origin === env.clientUrl) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// HTTP request logging
app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NexaChain Investment & Referral Platform API',
    data: {
      version: '1.0.0',
      environment: env.nodeEnv,
      docs: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const timestamp = new Date().toISOString();

  if (dbStatus.isConnected) {
    return res.status(200).json({
      success: true,
      message: 'NexaChain API is healthy and operational',
      data: {
        status: 'healthy',
        database: dbStatus.statusText,
        uptime: process.uptime(),
        timestamp
      }
    });
  }

  // Database disconnected/unreachable -> return HTTP 503 Service Unavailable
  return res.status(503).json({
    success: false,
    message: 'NexaChain API is degraded: Database is disconnected',
    errors: [
      {
        status: 'degraded',
        database: dbStatus.statusText,
        timestamp,
        guidance: 'Ensure MongoDB is running and reachable via MONGO_URI'
      }
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/referrals', referralRoutes);

// 404 handler for unknown routes
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
