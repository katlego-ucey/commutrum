import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "./logger.js";

const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !JWT_SECRET) {
  logger.fatal("JWT_SECRET environment variable is required in production");
  process.exit(1);
}

const secret = JWT_SECRET || "dev-secret-do-not-use-in-production";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, secret) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch (error) {
    logger.error({ error }, "JWT verification failed");
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
