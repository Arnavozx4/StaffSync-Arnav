import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app, initializeDatabase } = require('../../server/server.js');

export default async function handler(req, res) {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Vercel API initialization failed:', error.message);
    return res.status(503).json({
      success: false,
      message: error.message.includes('MONGO_URI')
        ? error.message
        : 'The API could not connect to its database. Check the Vercel function logs and database configuration.',
    });
  }
}
