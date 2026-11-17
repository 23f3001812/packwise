const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin SDK
require('./config/firebaseAdmin');

const healthRoutes = require('./routes/healthRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend and local network devices
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'PackWise API Backend',
    version: '1.0.0',
    description: 'AI-Powered Context-Aware Packing and Intelligent Item Management System',
    status: 'online',
    healthCheck: '/api/health'
  });
});

// API Routes
app.use('/api/health', healthRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

// Start server listening on all network interfaces (0.0.0.0) so physical devices can reach it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 PackWise Backend Server is running!`);
  console.log(`📍 Local:            http://localhost:${PORT}`);
  console.log(`🌐 Network listener: http://0.0.0.0:${PORT}`);
  console.log(`🩺 Health check:     http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

module.exports = app;

