const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connect to MongoDB instance using Mongoose.
 * @param {string} [customUri] Optional URI override (useful for tests or in-memory DB)
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async (customUri) => {
  const uri = customUri || env.mongoUri;

  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30 seconds if offline
    autoIndex: env.isDevelopment // Build indexes automatically in development only
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
};

/**
 * Disconnect from MongoDB cleanly.
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB connection closed cleanly');
    }
  } catch (error) {
    console.error('❌ Error during MongoDB disconnection:', error.message);
    throw error;
  }
};

/**
 * Returns current database connection status.
 * @returns {{ state: number, statusText: string, isConnected: boolean }}
 */
const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const state = mongoose.connection.readyState;
  return {
    state,
    statusText: states[state] || 'unknown',
    isConnected: state === 1
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus
};

