// PromptToCode Backend Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB, isDbConnected } from './db.js';
import webhookRoutes from './routes/webhooks.js';
import userRoutes from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root or server .env
dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Webhook endpoint requires raw body for Svix cryptographic signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON body parser for normal API endpoints
app.use(express.json());

// User synchronization and management routes
app.use('/api/users', userRoutes);

// Public configuration endpoint (shares publishable key securely from backend)
app.get('/api/config', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: join(__dirname, '../.env'), override: true });
  }

  const clerkPublishableKey = (
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    ''
  ).trim();

  res.json({
    clerkPublishableKey,
    environment: process.env.NODE_ENV || 'development',
    hasBackend: true,
    mongoConnected: isDbConnected(),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'prompttocode-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      type: 'mongodb',
      connected: isDbConnected(),
    },
  });
});

// Start Express Server and connect to MongoDB
app.listen(PORT, async () => {
  console.log(`🚀 PromptToCode backend running on http://localhost:${PORT}`);
  await connectDB();
});
