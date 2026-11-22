import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

export type AccessTokenPayload = { sub: string; roles: string[] };
export type RefreshTokenPayload = { sub: string; jti: string };

export function signAccessToken(userId: string, roles: string[]): string {
  return jwt.sign({ sub: userId, roles } satisfies AccessTokenPayload, accessSecret, {
    expiresIn: accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string, jti: string): string {
  return jwt.sign({ sub: userId, jti } satisfies RefreshTokenPayload, refreshSecret, {
    expiresIn: refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, refreshSecret) as RefreshTokenPayload;
}

/** Refresh tokens are stored hashed — a DB leak must not leak usable tokens. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry(): Date {
  const ttl = parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN ?? '30d');
  return new Date(Date.now() + ttl);
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return n * unit;
}
