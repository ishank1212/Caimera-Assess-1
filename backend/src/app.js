const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration
// Allow requests from frontend (Vercel in production, localhost in development)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware (Development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Math Quiz Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Competitive Math Quiz API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      websocket: 'Connect via Socket.io client'
    }
  });
});

// 404 Handler - Must be after all other routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error Handling Middleware - Must be last
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
