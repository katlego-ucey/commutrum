import { Router, type Router as RouterType, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { db, schema } from '@commutrum/db';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { authenticate, AuthPayload } from '../middleware/authenticate.js';

const router: RouterType = Router();

// ─── Schemas ─────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Helpers ─────────────────────────────────────────────────────────

function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  return { accessToken, refreshToken, refreshTokenHash };
}

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Create a new user account.
 */
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, displayName } = req.body;

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const [user] = await db
        .insert(schema.users)
        .values({
          email,
          passwordHash,
          displayName: displayName || null,
        })
        .returning({
          id: schema.users.id,
          email: schema.users.email,
          displayName: schema.users.displayName,
          createdAt: schema.users.createdAt,
        });

      // Generate tokens
      const payload: AuthPayload = { userId: user.id, email: user.email };
      const { accessToken, refreshToken, refreshTokenHash } = generateTokens(payload);

      // Store refresh token
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/login
 * Authenticate and receive tokens.
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate tokens
      const payload: AuthPayload = { userId: user.id, email: user.email };
      const { accessToken, refreshToken, refreshTokenHash } = generateTokens(payload);

      // Store refresh token
      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        accessToken,
        refreshToken,
        expiresIn: 900,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/refresh
 * Exchange a refresh token for a new access token.
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Find stored refresh token
      const [stored] = await db
        .select()
        .from(schema.refreshTokens)
        .where(eq(schema.refreshTokens.tokenHash, tokenHash))
        .limit(1);

      if (!stored) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      if (new Date() > stored.expiresAt) {
        await db
          .delete(schema.refreshTokens)
          .where(eq(schema.refreshTokens.id, stored.id));
        res.status(401).json({ error: 'Refresh token expired' });
        return;
      }

      // Get user
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, stored.userId))
        .limit(1);

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Delete old refresh token (rotation)
      await db
        .delete(schema.refreshTokens)
        .where(eq(schema.refreshTokens.id, stored.id));

      // Generate new tokens
      const payload: AuthPayload = { userId: user.id, email: user.email };
      const tokens = generateTokens(payload);

      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash: tokens.refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/logout
 * Invalidate the current refresh token.
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await db
          .delete(schema.refreshTokens)
          .where(eq(schema.refreshTokens.tokenHash, tokenHash));
      }

      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile.
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [user] = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          displayName: schema.users.displayName,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(eq(schema.users.id, req.user!.userId))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
);

export default router;