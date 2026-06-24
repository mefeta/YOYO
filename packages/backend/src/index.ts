import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import agentRoutes from './routes/agents.js';
import teamRoutes from './routes/teams.js';
import analyticsRoutes from './routes/analytics.js';
import reportRoutes from './routes/reports.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes - auth/login is unprotected; everything else requires JWT
app.use('/api/auth', authRoutes);
app.use('/api', authMiddleware);
app.use('/api/requests', requestRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// Health check (unprotected)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API docs summary
app.get('/api', (_req, res) => {
  res.json({
    name: 'YOYO API',
    version: '1.0.0',
    description: 'Operational management platform',
    endpoints: {
      auth: ['POST /api/auth/login', 'GET /api/auth/me'],
      requests: ['GET/POST /api/requests', 'GET/PATCH/DELETE /api/requests/:id', 'POST /api/requests/:id/analyze', 'POST /api/requests/:id/assign', 'POST /api/requests/:id/status', 'GET /api/requests/:id/events'],
      agents: ['GET /api/agents', 'GET /api/agents/:id', 'GET /api/agents/:id/performance'],
      teams: ['GET /api/teams', 'GET /api/teams/:id'],
      analytics: ['GET /api/analytics/overview', 'GET /api/analytics/trends', 'GET /api/analytics/categories', 'GET /api/analytics/sla', 'GET /api/analytics/agent-utilization'],
      reports: ['GET /api/reports', 'POST /api/reports/generate', 'GET /api/reports/sla', 'GET /api/reports/performance'],
      ai: ['POST /api/ai/classify-request', 'POST /api/ai/recommend-assignment'],
    },
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`YOYO API running on http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});
