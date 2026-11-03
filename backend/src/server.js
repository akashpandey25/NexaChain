const env = require('./config/env');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const {
  startDailyRoiScheduler,
  stopDailyRoiScheduler,
  instanceIdentifier
} = require('./cron/dailyRoiJob');
const { releaseLock } = require('./services/jobLockService');

let server;

/**
 * Start NexaChain backend server.
 * Connects to MongoDB before accepting requests and starts the background scheduler.
 */
const startServer = async () => {
  try {
    console.log(`[NexaChain] Initializing server in ${env.nodeEnv} mode...`);

    // 1. Establish MongoDB connection before accepting incoming requests
    await connectDB();

    // 2. Start HTTP listener only after database connects
    server = app.listen(env.port, () => {
      console.log(`🚀 NexaChain Server listening on port ${env.port}`);
      console.log(`🌐 Health check available at: http://localhost:${env.port}/api/health`);
    });

    // 3. Start background scheduler only after database is ready
    startDailyRoiScheduler();

    return server;
  } catch (error) {
    console.error('❌ Server startup aborted: Failed to connect to database.');
    console.error(`❌ Details: ${error.message}`);
    console.error('👉 Diagnostic: Ensure MongoDB is running (e.g. net start MongoDB / mongod) or update MONGO_URI in backend/.env');
    process.exit(1);
  }
};

/**
 * Cleanly shut down scheduler, HTTP server, distributed locks, and MongoDB connections.
 * @param {string} signal
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // 1. Stop background scheduler tasks immediately
  try {
    stopDailyRoiScheduler();
  } catch (schedErr) {
    console.warn(`[Shutdown] Warning stopping scheduler: ${schedErr.message}`);
  }

  // 2. Release any distributed locks held by this instance
  try {
    await releaseLock('DAILY_ROI_PROCESSING', instanceIdentifier);
  } catch (lockErr) {
    console.warn(`[Shutdown] Warning releasing distributed lock: ${lockErr.message}`);
  }

  // 3. Close HTTP server and terminate database connection
  if (server) {
    server.close(async () => {
      console.log('🔒 HTTP server closed');
      try {
        await disconnectDB();
        console.log('👋 Process terminating cleanly');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during database disconnect on shutdown:', err.message);
        process.exit(1);
      }
    });

    // Fallback: force exit if closing takes longer than 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating process due to shutdown timeout');
      process.exit(1);
    }, 10000).unref();
  } else {
    try {
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  }
};

// Handle process termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Start the server if invoked directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer, gracefulShutdown };
