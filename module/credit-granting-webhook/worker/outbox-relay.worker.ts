import { OutboxEventEntity } from "../domain/outbox-event.entity.js";
import { ILogger } from "../domain/logger.interface.js";
import { IOutboxRepository } from "../repositories/outbox.repository.js";
import { webhookQueue } from "../infra/queue/bullmq.adapter.js";

export class OutboxRelayWorker {
  private static readonly POLL_INTERVAL_MS = 5000;
  private static readonly BATCH_LIMIT = 10;

  constructor(
    private readonly outboxRepo: IOutboxRepository,
    private readonly logger: ILogger,
  ) {}

  public iniciarPolling(): void {
    setInterval(() => this.executarCiclo(), OutboxRelayWorker.POLL_INTERVAL_MS);
  }

  private async executarCiclo(): Promise<void> {
    try {
      const eventos = await this.outboxRepo.findPending(OutboxRelayWorker.BATCH_LIMIT);

      for (const evento of eventos) { 
        await this.processarEvento(evento);
      }
    } catch (error) {
      this.logger.error("Erro crítico ao buscar eventos pendentes no banco", error);
    }
  }

  private async processarEvento(evento: OutboxEventEntity): Promise<void> {
    try {
      await webhookQueue.add('enviar-webhook', evento);
      evento.markAsProcessed();
      await this.outboxRepo.update(evento);
      
      this.logger.info(`Evento [${evento.id}] despachado para a fila do Redis com sucesso.`);
    } catch (error) {
      this.logger.error(`Erro crítico ao tentar colocar evento [${evento.id}] na fila`, error);
    }
  }
}