require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const env = require('./src/config/environment');
const { startEventNotificationCron } = require('./src/utils/eventNotificationCron');

const PORT = env.port;

async function start() {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync models (create tables if not exist)
    await sequelize.sync({ alter: env.nodeEnv === 'development' });
    console.log('✅ Database synced');

    // Start push notification cron jobs
    startEventNotificationCron();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${env.nodeEnv}`);
      console.log(`🌐 API URL: ${env.app.apiUrl}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

start();
