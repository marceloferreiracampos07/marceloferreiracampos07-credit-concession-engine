import { OutboxEventEntity } from "../domain/outbox-event.entity.js";

export interface IOutboxRepository {
  save(event: OutboxEventEntity, transactionContext?: any): Promise<void>;
  findPending(limit: number): Promise<OutboxEventEntity[]>;
  update(event: OutboxEventEntity, transactionContext?: any): Promise<void>;
}
