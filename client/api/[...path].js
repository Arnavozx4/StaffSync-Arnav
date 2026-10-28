import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { delimiter } = require('node:path');
const { _initPaths } = require('node:module');

// The Vercel project is rooted at the repository, while dependencies are
// installed from client/package.json. Make them visible to the sibling server.
const clientNodeModules = fileURLToPath(new URL('../node_modules', import.meta.url));
process.env.NODE_PATH = [clientNodeModules, process.env.NODE_PATH]
  .filter(Boolean)
  .join(delimiter);
_initPaths();

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
