const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from backend/.env regardless of launch directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback for current working directory if different

// Initialize Firebase Admin SDK
require('./config/firebaseAdmin');

const healthRoutes = require('./routes/healthRoutes');
const listRoutes = require('./routes/listRoutes');
const itemRoutes = require('./routes/itemRoutes');
const containerRoutes = require('./routes/containerRoutes');
const aiRoutes = require('./routes/aiRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const locationRoutes = require('./routes/locationRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
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

// Request logging in development with response completion tracking
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] --> ${req.method} ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] <-- ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      const duration = Date.now() - start;
      console.warn(`[${new Date().toISOString()}] <-- ${req.method} ${req.url} [CLIENT_CLOSED_PREMATURELY] (${duration}ms)`);
    }
  });

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
app.use('/api/lists', listRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

// Start server listening on all network interfaces (0.0.0.0) so physical devices can reach it
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`[PackWise Server] Started successfully.`);
    console.log(`- Local:            http://localhost:${PORT}`);
    console.log(`- Network listener: http://0.0.0.0:${PORT}`);
    console.log(`- Health check:     http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

module.exports = app;

