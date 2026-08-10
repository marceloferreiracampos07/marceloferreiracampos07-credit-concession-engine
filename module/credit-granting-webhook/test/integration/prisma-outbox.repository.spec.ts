import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaOutboxRepository } from '../../repositories/prisma-outbox.repository.js';
import { OutboxEventEntity } from '../../domain/outbox-event.entity.js';
import { execSync } from 'child_process';
import path from 'path';

describe('PrismaOutboxRepository Integration', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let repository: PrismaOutboxRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();

    const databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    execSync(`npx prisma db push --schema=${schemaPath}`, { env: { ...process.env, DATABASE_URL: databaseUrl } });

    prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    repository = new PrismaOutboxRepository(prisma);
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany({});
  });

  it('should save a new outbox event', async () => {
    const event = new OutboxEventEntity(
      'uuid-123',
      'CreditAnalysis',
      'Approved',
      'https://webhook.site/test',
      'JSON',
      { analysisId: '123' },
      'PENDING',
      new Date(),
      new Date()
    );

    await repository.save(event);

    const savedEvent = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(savedEvent).toBeDefined();
    expect(savedEvent?.status).toBe('PENDING');
    expect(savedEvent?.aggregateType).toBe('CreditAnalysis');
  });

  it('should find pending events', async () => {
    const event1 = new OutboxEventEntity('uuid-1', 'Test', 'Event1', 'http://url1', 'JSON', {}, 'PENDING', new Date(), new Date());
    const event2 = new OutboxEventEntity('uuid-2', 'Test', 'Event2', 'http://url2', 'XML', {}, 'PENDING', new Date(), new Date());
    event2.markAsProcessed();

    await repository.save(event1);
    await repository.save(event2);

    const pendingEvents = await repository.findPending(10);
    expect(pendingEvents).toHaveLength(1);
    expect(pendingEvents[0].id).toBe(event1.id);
  });

  it('should update an event status', async () => {
    const event = new OutboxEventEntity('uuid-3', 'Test', 'Event', 'http://url', 'JSON', {}, 'PENDING', new Date(), new Date());
    await repository.save(event);

    event.markAsProcessed();
    await repository.update(event);

    const updatedEvent = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(updatedEvent?.status).toBe('PROCESSED');
  });
});
