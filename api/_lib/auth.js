import crypto from 'node:crypto';

const COOKIE_NAME = 'sk_gate_auth';
const RL_COOKIE_NAME = 'sk_gate_rl';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function b64urlDecode(str) {
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function hmac(secret, msg) {
  return crypto.createHmac('sha256', secret).update(msg).digest();
}

function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').map(v => v.trim()).filter(Boolean).forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function serializeCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

export function requireSecret() {
  const secret = process.env.ACCESS_GATE_APP_SECRET_R2 || process.env.ACCESS_GATE_APP_SECRET;
  if (!secret) return null;
  return secret;
}

function signToken(secret, payloadObj) {
  const payload = b64url(JSON.stringify(payloadObj));
  const sig = b64url(hmac(secret, payload));
  return `${payload}.${sig}`;
}

function verifyToken(secret, token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = b64url(hmac(secret, payload));
  if (!timingSafeEqualStr(sig, expected)) return null;
  try {
    const obj = JSON.parse(b64urlDecode(payload).toString('utf-8'));
    return obj;
  } catch {
    return null;
  }
}

export function getSignedCookie(secret, req, name) {
  const c = parseCookies(req);
  const tok = c[name];
  return verifyToken(secret, tok);
}

export function setSignedCookie(secret, res, name, payloadObj, opts = {}) {
  const tok = signToken(secret, payloadObj);
  const cookie = serializeCookie(name, tok, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: opts.maxAge ?? 60 * 60 * 24
  });
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', cookie);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', [...prev, cookie]);
  else res.setHeader('Set-Cookie', [prev, cookie]);
}

// Rate-limit cookie payload: {failCount, lockedUntil, lastFailAt}
export function getRateLimit(secret, req) {
  const c = parseCookies(req);
  const tok = c[RL_COOKIE_NAME];
  return verifyToken(secret, tok) || { failCount: 0, lockedUntil: 0, lastFailAt: 0 };
}

export function setRateLimit(secret, res, state) {
  const tok = signToken(secret, state);
  res.setHeader('Set-Cookie', serializeCookie(RL_COOKIE_NAME, tok, {
    httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 60 * 60 * 24
  }));
}

export function checkPassword(secret, inputPassword) {
  const hashEnv = process.env.ACCESS_GATE_PASSWORD_HASH;
  const passEnv = process.env.ACCESS_GATE_PASSWORD;
  if (!hashEnv && !passEnv) return { ok: false, reason: 'PASSWORD_ENV_MISSING' };

  if (hashEnv) {
    const inHash = sha256Hex(inputPassword);
    return { ok: timingSafeEqualStr(inHash, String(hashEnv).trim()), reason: 'HASH' };
  }

  // fallback plain compare
  return { ok: timingSafeEqualStr(String(inputPassword), String(passEnv)), reason: 'PLAIN' };
}

export function setAuthCookie(secret, res, sessionObj) {
  const tok = signToken(secret, sessionObj);
  const cookie = serializeCookie(COOKIE_NAME, tok, {
    httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 60 * 60 * 24
  });
  // If RL cookie already set, we need multiple Set-Cookie support.
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', cookie);
  else if (Array.isArray(prev)) res.setHeader('Set-Cookie', [...prev, cookie]);
  else res.setHeader('Set-Cookie', [prev, cookie]);
}

export function requireAuth(req) {
  const secret = requireSecret();
  if (!secret) return { ok: false, code: 403, error: 'SECRET_MISSING' };
  const c = parseCookies(req);
  const tok = c[COOKIE_NAME];
  const sess = verifyToken(secret, tok);
  if (!sess || !sess.auth) return { ok: false, code: 401, error: 'UNAUTHENTICATED' };
  return { ok: true, secret, session: sess };
}
