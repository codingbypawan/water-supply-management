const env = require('./environment');

// Build allowed origins list from CORS_ORIGINS env var (comma-separated) or fallback to APP_URL
const getAllowedOrigins = () => {
  const corsEnv = process.env.CORS_ORIGINS;
  if (corsEnv) {
    return corsEnv.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return [env.app.url].filter(Boolean);
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (env.nodeEnv === 'development') {
      return callback(null, true);
    }

    // In production, use CORS_ORIGINS from env (docker-compose) or APP_URL
    const allowedOrigins = getAllowedOrigins();

    const isAllowed = allowedOrigins.some((allowed) => allowed === origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Plant-ID'],
};

module.exports = corsOptions;
