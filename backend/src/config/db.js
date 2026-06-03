import pg from 'pg';
import 'dotenv/config';
import { newDb } from 'pg-mem';

const { Pool } = pg;

let pool;
let memoryDb;
let memoryMode = false;
let initialized = false;

function createMemoryPool() {
  if (!memoryDb) {
    memoryDb = newDb();
  }

  if (!pool || !memoryMode) {
    const { Pool: MemoryPool } = memoryDb.adapters.createPg();
    pool = new MemoryPool();
    memoryMode = true;
  }

  return pool;
}

function createPostgresPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL tanımlı değil. Yerelde PostgreSQL yoksa fallback devreye girer.');
  }

  if (!pool || memoryMode) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });
    memoryMode = false;
  }

  return pool;
}

function getPool() {
  if (pool && initialized) {
    return pool;
  }

  if (process.env.NODE_ENV === 'production') {
    return createPostgresPool();
  }

  if (process.env.DATABASE_URL) {
    return createPostgresPool();
  }

  return createMemoryPool();
}

async function ensureSchema(activePool) {
  await activePool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id        SERIAL PRIMARY KEY,
      date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      model     VARCHAR(100) NOT NULL,
      comment   TEXT NOT NULL,
      sentiment VARCHAR(20) NOT NULL,
      category  VARCHAR(50) NOT NULL DEFAULT 'Genel',
      summary   TEXT,
      reply     TEXT
    )
  `);

  await activePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             SERIAL PRIMARY KEY,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      full_name      VARCHAR(120) NOT NULL,
      email          VARCHAR(160) NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      team_name      VARCHAR(160),
      plan           VARCHAR(40) NOT NULL DEFAULT 'Free'
    )
  `);
}

export async function initDb() {
  try {
    const activePool = getPool();
    await activePool.query('SELECT 1');
    await ensureSchema(activePool);
    initialized = true;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const fallbackCodes = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET']);
      if (fallbackCodes.has(error.code) || /connect/i.test(error.message || '')) {
        pool = createMemoryPool();
        await ensureSchema(pool);
        initialized = true;
        console.log('Yerel PostgreSQL bulunamadı, pg-mem fallback devrede');
        return;
      }
    }

    throw new Error(error.message || error.code || 'PostgreSQL bağlantısı kurulamadı');
  }

  console.log(memoryMode ? 'pg-mem geliştirme veritabanı hazır' : 'PostgreSQL bağlantısı ve tablo hazır');
}

export async function saveLog({ model, comment, sentiment, category, summary, reply }) {
  await getPool().query(
    `INSERT INTO logs (model, comment, sentiment, category, summary, reply)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [model, comment, sentiment, category, summary, reply],
  );
}

export async function fetchAll() {
  const { rows } = await getPool().query('SELECT * FROM logs ORDER BY id DESC');
  return rows;
}

export async function deleteAll() {
  await getPool().query('DELETE FROM logs');
}

export async function findUserByEmail(email) {
  const { rows } = await getPool().query(
    `SELECT id, created_at, full_name, email, password_hash, team_name, plan
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await getPool().query(
    `SELECT id, created_at, full_name, email, team_name, plan
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
}

export async function createUser({ fullName, email, passwordHash, teamName, plan = 'Free' }) {
  const { rows } = await getPool().query(
    `INSERT INTO users (full_name, email, password_hash, team_name, plan)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at, full_name, email, team_name, plan`,
    [fullName, email, passwordHash, teamName || null, plan],
  );

  return rows[0];
}
