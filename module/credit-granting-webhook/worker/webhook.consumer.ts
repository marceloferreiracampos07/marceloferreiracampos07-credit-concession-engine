import { Worker, Job } from 'bullmq';
import { IWebhookFormatterStrategy } from '../Strategy/webhook-formatter.strategy.js';
import { ILogger } from '../domain/logger.interface.js';
import { redisConnection } from '../infra/queue/bullmq.adapter.js';

type RawOutboxEvent = {
  id: string;
  tenantUrl: string;
  tenantFormat: string;
  payload: Record<string, any>;
};

export class WebhookConsumer {
  private worker: Worker;

  constructor(
    private readonly formatterMap: Map<string, IWebhookFormatterStrategy>,
    private readonly logger: ILogger,
  ) {
    this.worker = new Worker('webhook-queue', async (job: Job) => {
      const eventoRaw = job.data as RawOutboxEvent;
      await this.enviarWebhook(eventoRaw);
    }, { connection: redisConnection });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      if (job) {
         this.logger.error(`Tentativa falha ao processar evento [${job.data.id}]. Erro: ${err.message}`);
      }
    });

    this.worker.on('completed', (job: Job) => {
      this.logger.info(`Evento [${job.data.id}] processado com SUCESSO e finalizado no BullMQ.`);
    });
  }

  private async enviarWebhook(evento: RawOutboxEvent): Promise<void> {
    const formatter = this.formatterMap.get(evento.tenantFormat);

    if (!formatter) {
      throw new Error(`Formatter não encontrado para o formato: ${evento.tenantFormat}`);
    }

    const response = await fetch(evento.tenantUrl, {
      method: 'POST',
      headers: { 'Content-Type': formatter.getContentType() },
      body: formatter.format(evento.payload),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
