import crypto from 'node:crypto';
import { Router } from 'express';
import { createUser, findUserByEmail, findUserById } from '../config/db.js';

const router = Router();

const TOKEN_SECRET = process.env.AUTH_SECRET || 'yorum-gelistirme-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function signToken(user) {
  const payload = encodePayload({
    sub: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS,
  });

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

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

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!decoded.exp || decoded.exp < Date.now()) {
    return null;
  }

  return decoded;
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    teamName: user.team_name,
    plan: user.plan,
    createdAt: user.created_at,
  };
}

router.post('/auth/signup', async (req, res) => {
  try {
    const {
      fullName = '',
      email = '',
      password = '',
      teamName = '',
    } = req.body || {};

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      return res.status(400).json({ error: 'Ad soyad, e-posta ve şifre zorunludur.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const existingUser = await findUserByEmail(email.trim());
    if (existingUser) {
      return res.status(409).json({ error: 'Bu e-posta ile kayıtlı bir kullanıcı zaten var.' });
    }

    const createdUser = await createUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      teamName: teamName.trim(),
    });

    const token = signToken(createdUser);
    res.status(201).json({ token, user: publicUser(createdUser) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Kayıt sırasında hata oluştu.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};

    if (!email.trim() || !password.trim()) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
    }

    const user = await findUserByEmail(email.trim());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Giriş sırasında hata oluştu.' });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const token = extractToken(req);
    const payload = verifyToken(token);

    if (!payload?.sub) {
      return res.status(401).json({ error: 'Oturum bulunamadı.' });
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Oturum doğrulanamadı.' });
  }
});

export default router;
