import { PrismaClient } from '@prisma/client';
import { IOutboxRepository } from './outbox.repository.js';
import { OutboxEventEntity, OutboxStatus, TenantFormat } from '../domain/outbox-event.entity.js';

export class PrismaOutboxRepository implements IOutboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(event: OutboxEventEntity, transactionContext?: any): Promise<void> {
    const db = transactionContext || this.prisma;
    await db.outboxEvent.create({
      data: this.toPrisma(event),
    });
  }

  async findPending(limit: number): Promise<OutboxEventEntity[]> {
    // Atenção: A sintaxe exata pode mudar levemente dependendo se você usa PostgreSQL ou MySQL.
    // Esta query assume PostgreSQL.
    const rawEvents = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "outbox_events"
      WHERE "status" = 'PENDING'
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    return rawEvents.map(row => this.toDomain(row));
  }

  async update(event: OutboxEventEntity, transactionContext?: any): Promise<void> {
    const db = transactionContext || this.prisma;
    await db.outboxEvent.update({
      where: { id: event.id },
      data: this.toPrisma(event),
    });
  }

  private toPrisma(event: OutboxEventEntity): any {
    return {
      id: event.id,
      aggregateType: event.aggregateType,
      eventType: event.eventType,
      tenantUrl: event.tenantUrl,
      tenantFormat: event.tenantFormat,
      payload: event.payload, // O Prisma lida nativamente se a coluna for JSON
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private toDomain(raw: any): OutboxEventEntity {
    return new OutboxEventEntity(
      raw.id,
      raw.aggregateType,
      raw.eventType,
      raw.tenantUrl,
      raw.tenantFormat as TenantFormat,
      raw.payload, // Pode precisar de typeof raw.payload === 'string' ? JSON.parse(raw.payload) : raw.payload dependendo do driver
      raw.status as OutboxStatus,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}
