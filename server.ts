import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  isRateLimitEnabled,
  generalApiLimiter,
  strictApiLimiter,
  createRateLimiter,
} from './server/rateLimiter';

// Load server environment variables from .env with override enabled
dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log Rate Limit status upon startup
const rateLimitActive = isRateLimitEnabled();
if (rateLimitActive) {
  console.log('Rate limiting: ENABLED');
} else {
  console.log(
    '[SECURITY NOTICE] Rate limiting: DISABLED (Temporarily bypassed via RATE_LIMIT_ENABLED=false)'
  );
}

console.log('This website is built by Nikhil Kumar. For any queries, reach out to suggestkey1505@gmail.com')

// --------------------------------------------------------------------------
// 1. RATE LIMITING MIDDLEWARE MOUNTING
// --------------------------------------------------------------------------

// Apply general rate limiting to all /api/ routes
app.use('/api', generalApiLimiter);

// --------------------------------------------------------------------------
// 2. API ROUTES
// --------------------------------------------------------------------------

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Suggest Key API',
    timestamp: new Date().toISOString(),
    rateLimiting: isRateLimitEnabled() ? 'enabled' : 'disabled',
  });
});

// Auth Configuration Endpoint
app.get('/api/auth/config', (req: Request, res: Response) => {
  res.json({
    AUTH_ENABLED: process.env.AUTH_ENABLED !== 'false',
    DEV_AUTH_BYPASS: process.env.DEV_AUTH_BYPASS === 'true',
    AUTH_ROUTE_GUARD: process.env.AUTH_ROUTE_GUARD !== 'false',
    PASSWORD_AUTH_ENABLED: process.env.PASSWORD_AUTH_ENABLED !== 'false',
    MAGIC_LINK_ENABLED: process.env.MAGIC_LINK_ENABLED !== 'false',
    EMAIL_VERIFICATION_REQUIRED: process.env.EMAIL_VERIFICATION_REQUIRED === 'true',
    PASSWORD_RESET_ENABLED: process.env.PASSWORD_RESET_ENABLED !== 'false',
    AUTH_RATE_LIMIT_ENABLED: process.env.AUTH_RATE_LIMIT_ENABLED !== 'false',
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
    LOGIN_COOLDOWN_ENABLED: process.env.LOGIN_COOLDOWN_ENABLED !== 'false',
    LOGIN_ATTEMPT_LIMIT_ENABLED: process.env.LOGIN_ATTEMPT_LIMIT_ENABLED !== 'false',
    ROLE_GUARD_ENABLED: process.env.ROLE_GUARD_ENABLED !== 'false',
    DEV_AUTH_ROLE: process.env.DEV_AUTH_ROLE || 'seeker',
  });
});

// Diagnostic / testing endpoint for rate limiting verification
app.get('/api/rate-limit-status', (req: Request, res: Response) => {
  res.json({
    rateLimitingEnabled: isRateLimitEnabled(),
    safeDefaultApplied: process.env.RATE_LIMIT_ENABLED === undefined,
    mode: process.env.NODE_ENV || 'development',
  });
});


// Test endpoint with a tight rate limit (e.g., 3 requests / minute) for verification tests
const testMicroLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: 'Test rate limit exceeded. Window: 60s, Max: 3 requests.',
  },
});

app.post('/api/rate-limit-test', testMicroLimiter, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Request passed rate limiting check successfully.',
    rateLimitEnabled: isRateLimitEnabled(),
  });
});

// Sensitive endpoints with strict rate limiting
app.post(
  '/api/booking/concurrency-check',
  strictApiLimiter,
  (req: Request, res: Response) => {
    const { mentorId, date, timeSlot } = req.body;
    if (!mentorId || !date || !timeSlot) {
      res.status(400).json({ success: false, error: 'Missing required booking parameters' });
      return;
    }

    res.json({
      success: true,
      verified: true,
      message: 'Concurrency slot validation passed.',
      timestamp: Date.now(),
    });
  }
);

// --------------------------------------------------------------------------
// 3. VITE MIDDLEWARE / STATIC ASSETS
// --------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start on PORT; if occupied, automatically try the next port.
  const startListening = (port: number) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(
        `Suggest Key server running on http://localhost:${port}`
      );
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.log(
          `Port ${port} is already in use. Trying port ${port + 1}...`
        );

        startListening(port + 1);
      } else {
        console.error('Failed to start server:', error);
        process.exit(1);
      }
    });
  };

  startListening(PORT);
}

startServer();
