import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DATABASE_CONFIG } from '../config/database.js';

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: DATABASE_CONFIG.POOL_MAX,
  idleTimeoutMillis: DATABASE_CONFIG.IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DATABASE_CONFIG.CONNECTION_TIMEOUT_MS,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
});
