import crypto from 'node:crypto';

const TOKEN_SECRET = process.env.AUTH_SECRET || 'yorum-gelistirme-secret';

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Date.now()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  const payload = verifyToken(token);

  if (!payload?.sub) {
    return res.status(401).json({ error: 'Bu işlem için önce giriş yapmalısın.' });
  }

  req.auth = payload;
  return next();
}
