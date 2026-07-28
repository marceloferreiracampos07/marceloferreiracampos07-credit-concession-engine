import { OutboxEvent } from "../../Domain/entities/OutboxEvent.js";
import { IOutboxEventRepository } from "../../Domain/repository/IOutboxEventRepository.js";
import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { asPrismaTransaction } from "./transactionGuard.js";
import type { Prisma } from "@prisma/client";

export class OutboxEventRepository implements IOutboxEventRepository {
    async save(event: OutboxEvent, tx: ITransaction): Promise<void> {
        const { client } = asPrismaTransaction(tx);

        await client.outboxEvent.create({
            data: {
                id: event.id,
                tenantId: event.tenantId,
                contractId: event.contractId,
                aggregateType: event.aggregateType,
                eventType: event.eventType,
                payload: event.payload as Prisma.InputJsonValue,
                idempotencyKey: event.idempotencyKey,
                tenantUrl: event.tenantUrl,
                tenantFormat: event.tenantFormat,
                status: event.status,
                attempts: event.attempts,
                nextAttemptAt: event.nextAttemptAt,
                createdAt: event.createdAt,
            },
        });
    }
}
