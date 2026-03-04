const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const { limiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const ApiResponse = require('./utils/response');

const app = express();

// ── Security ──
app.use(helmet());
app.use(cors(corsOptions));

// ── Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
app.use(morgan('combined'));

// ── Rate Limiting ──
app.use('/api/', limiter);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, 'Server is running');
});

// ── API Routes ──
app.use('/api/v1', routes);

// ── 404 Handler ──
app.use((req, res) => {
  ApiResponse.notFound(res, `Route ${req.method} ${req.url} not found`);
});

// ── Error Handler ──
app.use(errorHandler);

module.exports = app;
