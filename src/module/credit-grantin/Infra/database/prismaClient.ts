// src/infra/database/prismaClient.ts
// Singleton do PrismaClient com o adapter obrigatório do Prisma 7.
// No Prisma 7, o PrismaClient NÃO gerencia mais a conexão diretamente;
// ele precisa de um "driver adapter" que represente o pool de conexões.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
