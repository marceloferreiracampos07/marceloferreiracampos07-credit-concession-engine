import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { Contrato } from "../../Domain/entities/Contrato.js";
import { IContratoRepository } from "../../Domain/repository/Icontratorepository.js";
import { IOutboxEventRepository } from "../../Domain/repository/IOutboxEventRepository.js";
import { OutboxEvent } from "../../Domain/entities/OutboxEvent.js";
import { ReserveFundUseCase } from "../../application/Usecases/ReserveFundUseCase.js";
import { FundoRepository } from "../../Infra/database/fundorepository.js";
import { TenantRepository } from "../../Infra/database/tenantRepository.js";
import { PrismaUnitOfWork } from "../../Infra/database/UnitOfWork.js";
import { prisma } from "../../Infra/database/prismaClient.js";

class FailingContratoRepository implements IContratoRepository {
    async save(_contrato: Contrato, _tx: ITransaction): Promise<void> {
        throw new Error("CONTRACT_PERSISTENCE_FAILED");
    }
}

class OutboxEventRepositorySpy implements IOutboxEventRepository {
    public savedEvents: OutboxEvent[] = [];

    async save(event: OutboxEvent, _tx: ITransaction): Promise<void> {
        this.savedEvents.push(event);
    }
}

const TENANT_ID = "00000000-0000-0000-0000-000000000004";

describe("ReserveFundUseCase - Atomicidade (Cenário 4)", () => {
    beforeEach(async () => {
        await prisma.outboxEvent.deleteMany({ where: { tenantId: TENANT_ID } });
        await prisma.contrato.deleteMany({ where: { tenantId: TENANT_ID } });
        await prisma.fundo.deleteMany({ where: { tenantId: TENANT_ID } });
        await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });

        await prisma.tenant.create({
            data: {
                id: TENANT_ID,
                name: "Tenant Atomicidade",
                webhookUrl: "https://webhook.teste.com",
                webhookFormat: "JSON",
                webhookSecret: "secret",
            },
        });

        await prisma.fundo.create({ data: { tenantId: TENANT_ID, balance: 10_000 } });
    });

    it("reverte o débito se a gravação do contrato falhar", async () => {
        const useCase = new ReserveFundUseCase(
            new FundoRepository(),
            new FailingContratoRepository(),
            new OutboxEventRepositorySpy(),
            new TenantRepository(),
            new PrismaUnitOfWork(prisma),
        );

        await expect(useCase.executar({ tenantId: TENANT_ID, proposalId: randomUUID(), amount: 6_000 }))
            .rejects.toThrow("CONTRACT_PERSISTENCE_FAILED");

        const fundo = await prisma.fundo.findUnique({ where: { tenantId: TENANT_ID } });
        expect(fundo?.balance).toBe(10_000);
        expect(await prisma.contrato.count({ where: { tenantId: TENANT_ID } })).toBe(0);
        expect(await prisma.outboxEvent.count({ where: { tenantId: TENANT_ID } })).toBe(0);
    });

    afterAll(async () => prisma.$disconnect());
});
