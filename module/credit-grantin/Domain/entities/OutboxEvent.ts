import { Contrato } from "./Contrato.js";
import { EVENT_TYPES } from "../constants/EventTypes.js";
import { TenantWebhookConfig } from "../repository/ITenantRepository.js";
import { randomUUID } from "crypto";

export type OutboxEventStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export type OutboxPayload = Record<string, unknown>;

export class OutboxEvent {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly contractId: string,
        public readonly aggregateType: string,
        public readonly eventType: string,
        public readonly payload: OutboxPayload,
        public readonly idempotencyKey: string,
        public readonly tenantUrl: string,
        public readonly tenantFormat: string,
        public readonly status: OutboxEventStatus,
        public readonly attempts: number,
        public readonly nextAttemptAt: Date | null,
        public readonly createdAt: Date
    ) {
        this.validar();
    }

    public static createFromContract(
        contrato: Contrato,
        proposalId: string,
        amount: number,
        webhookConfig: TenantWebhookConfig
    ): OutboxEvent {
        const now = contrato.createdAt;
        return new OutboxEvent(
            randomUUID(),
            contrato.tenantId,
            contrato.id,
            "CONTRACT",
            EVENT_TYPES.CONTRACT_APPROVED,
            {
                contractId: contrato.id,
                tenantId: contrato.tenantId,
                proposalId,
                amount,
                status: contrato.status,
                createdAt: now.toISOString(),
            },
            contrato.id,
            webhookConfig.webhookUrl,
            webhookConfig.webhookFormat,
            'PENDING',
            0,
            null,
            now
        );
    }

    private validar(): void {
        if (!this.tenantId) {
            throw new Error("OutboxEvent deve estar vinculado a um Tenant.");
        }
        if (!this.contractId) {
            throw new Error("OutboxEvent deve estar vinculado a um Contrato.");
        }
        if (!this.eventType) {
            throw new Error("OutboxEvent deve possuir um tipo de evento.");
        }
        if (!this.idempotencyKey) {
            throw new Error("OutboxEvent deve possuir uma chave de idempotência.");
        }
        if (!this.payload || Object.keys(this.payload).length === 0) {
            throw new Error("OutboxEvent deve possuir um payload válido.");
        }
        if (!this.tenantUrl) {
            throw new Error("OutboxEvent deve possuir a URL do webhook do Tenant.");
        }
    }
}
