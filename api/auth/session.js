import { readJson, json } from '../_lib/http.js';
import {
  requireSecret,
  checkPassword,
  getRateLimit,
  setRateLimit,
  setAuthCookie,
  sha256Hex
} from '../_lib/auth.js';

export default async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const secret = requireSecret();
  if (!secret) return json(res, 403, { error: 'SECRET_MISSING', message: 'Locked' });

  let body = {};
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'INVALID_JSON' }); }

  const password = (body.password || '').toString();
  if (!password) return json(res, 400, { error: 'PASSWORD_REQUIRED' });

  // Rate limit before checking
  const rl = getRateLimit(secret, req);
  const now = Date.now();
  if (rl.lockedUntil && now < rl.lockedUntil) {
    const waitSec = Math.ceil((rl.lockedUntil - now) / 1000);
    return json(res, 429, { error: 'LOCKED', retry_after_seconds: waitSec });
  }

  const result = checkPassword(secret, password);
  if (!result.ok) {
    const failCount = (rl.failCount || 0) + 1;
    const lockedUntil = failCount >= 5 ? now + 15 * 60 * 1000 : 0;
    setRateLimit(secret, res, { failCount, lockedUntil, lastFailAt: now });
    return json(res, 401, { error: 'BAD_PASSWORD', failCount, locked: !!lockedUntil });
  }

  // Success resets rate limit
  setRateLimit(secret, res, { failCount: 0, lockedUntil: 0, lastFailAt: 0 });
  setAuthCookie(secret, res, { auth: true, iat: now, sid: sha256Hex(`${now}:${Math.random()}`) });
  return json(res, 200, { ok: true });
};
