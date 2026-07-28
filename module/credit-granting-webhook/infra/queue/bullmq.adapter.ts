import { Queue } from 'bullmq';
import {Redis} from "ioredis"

// Conexão com o Redis garantindo que as configurações venham do ambiente (.env)
// Caso não encontre, usamos localhost como padrão seguro apenas para ambiente de desenvolvimento.
export const redisConnection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

// Instanciando a fila do Webhook com a configuração de Retry nativa
export const webhookQueue = new Queue('webhook-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Máximo de 3 tentativas se a API do Tenant falhar
    backoff: {
      type: 'exponential',
      delay: 60000, // Começa com delay de 1 minuto 
    },
    removeOnComplete: true, // Limpa da memória do Redis quando finalizado com sucesso
    removeOnFail: false,    // Mantém no Redis (como falho) caso gaste as 3 tentativas
  },
});
