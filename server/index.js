import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root or server .env
dotenv.config({ path: join(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public configuration endpoint (shares publishable key securely from backend)
app.get('/api/config', (req, res) => {
  // Always read latest .env on config requests
  dotenv.config({ path: join(__dirname, '../.env'), override: true });
  
  const clerkPublishableKey = (
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    ''
  ).trim();

  res.json({
    clerkPublishableKey,
    environment: process.env.NODE_ENV || 'development',
    hasBackend: true,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'prompttocode-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 PromptToCode backend running on http://localhost:${PORT}`);
});
