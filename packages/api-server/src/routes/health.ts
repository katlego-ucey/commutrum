import { Router, type Router as RouterType, Request, Response } from "express";

const router: RouterType = Router();

/**
 * GET /api/health
 * Returns the health status of the API server.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'commutrum-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/db
 * Returns database connection status.
 */
router.get('/db', async (_req: Request, res: Response) => {
  try {
    const { testConnection } = await import('@commutrum/db');
    const isConnected = await testConnection();
    res.json({
      status: isConnected ? 'ok' : 'error',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;