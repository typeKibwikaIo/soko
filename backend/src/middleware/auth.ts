import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/tokens';

export type AuthUser = { id: string; roles: string[] };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Requires a valid Bearer access token. Attaches req.user = { id, roles }. */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, roles: payload.roles ?? [] };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

/** Requires one of the given roles (e.g. requireRole('VENDOR', 'ADMIN')). */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.some((r) => req.user!.roles.includes(r))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
