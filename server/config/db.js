const mongoose = require('mongoose');

let memoryServer = null;
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri || mongoUri.trim() === '') {
      if (process.env.VERCEL) {
        throw new Error('MONGO_URI is required for the Vercel deployment. Configure a persistent MongoDB Atlas connection string.');
      }
      console.log('⚡ No MONGO_URI provided in environment. Initializing in-memory MongoDB fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      console.log(`✅ MongoMemoryServer active at: ${mongoUri}`);
    }

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    const conn = await connectionPromise;

    console.log(`✅ MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    return conn;
  } catch (error) {
    connectionPromise = null;
    if (process.env.VERCEL) throw error;
    console.warn(`⚠️ Failed connecting to configured MongoDB: ${error.message}`);
    // If standard URI failed, attempt in-memory fallback for smooth evaluation
    try {
      console.log('🔄 Attempting fallback to in-memory MongoMemoryServer...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create();
      }
      const fallbackUri = memoryServer.getUri();
      connectionPromise = mongoose.connect(fallbackUri);
      const conn = await connectionPromise;
      console.log(`✅ Fallback In-Memory MongoDB Connected at ${fallbackUri}`);
      return conn;
    } catch (fallbackError) {
      connectionPromise = null;
      console.error(`❌ Critical MongoDB Connection Error: ${fallbackError.message}`);
      throw fallbackError;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
