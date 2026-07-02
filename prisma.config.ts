// prisma.config.ts  — raiz do projeto (C:\Users\JR\Documents\pcp)
// Prisma 7 exige este arquivo para configurar a URL do banco de dados.
// O import 'dotenv/config' DEVE ser o primeiro import para que as variáveis
// do .env sejam carregadas antes que qualquer outra coisa as utilize.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './src/module/credit-grantin/prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
