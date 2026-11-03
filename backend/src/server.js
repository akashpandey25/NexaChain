const env = require('./config/env');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

let server;

/**
 * Start NexaChain backend server.
 * Connects to MongoDB before accepting requests.
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

    return server;
  } catch (error) {
    console.error('❌ Server startup aborted: Failed to connect to database.');
    console.error(`❌ Details: ${error.message}`);
    console.error('👉 Diagnostic: Ensure MongoDB is running (e.g. net start MongoDB / mongod) or update MONGO_URI in backend/.env');
    process.exit(1);
  }
};

/**
 * Cleanly shut down HTTP server and MongoDB connections.
 * @param {string} signal
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

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
    process.exit(0);
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

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { startServer, gracefulShutdown };
