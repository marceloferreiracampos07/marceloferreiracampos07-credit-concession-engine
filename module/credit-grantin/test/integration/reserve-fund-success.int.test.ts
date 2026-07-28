import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { ReserveFundUseCase } from "../../application/Usecases/ReserveFundUseCase.js";
import { FundoRepository } from "../../Infra/database/fundorepository.js";
import { PrismaUnitOfWork } from "../../Infra/database/UnitOfWork.js";
import { prisma } from "../../Infra/database/prismaClient.js";
import { ContratoRepository } from "../../Infra/database/contratorepository.js";
import { OutboxEventRepository } from "../../Infra/database/outboxEventRepository.js";
import { TenantRepository } from "../../Infra/database/tenantRepository.js";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

describe("ReserveFundUseCase - Integração (Cenário 1)", () => {
    let useCase: ReserveFundUseCase;
    let fundoRepo: FundoRepository;
    let contratoRepo: ContratoRepository;
    let outboxRepo: OutboxEventRepository;
    let tenantRepo: TenantRepository;
    let uow: PrismaUnitOfWork;

    beforeEach(async () => {
        fundoRepo = new FundoRepository();
        contratoRepo = new ContratoRepository();
        outboxRepo = new OutboxEventRepository();
        tenantRepo = new TenantRepository();
        uow = new PrismaUnitOfWork(prisma);

        useCase = new ReserveFundUseCase(fundoRepo, contratoRepo, outboxRepo, tenantRepo, uow);

        await prisma.outboxEvent.deleteMany({});
        await prisma.contrato.deleteMany({});
        await prisma.fundo.deleteMany({});
        await prisma.tenant.deleteMany({});

        await prisma.tenant.create({
            data: {
                id: TENANT_ID,
                name: "Tenant Teste",
                webhookUrl: "https://webhook.teste.com",
                webhookFormat: "JSON",
                webhookSecret: "secret",
            },
        });

        await prisma.fundo.create({
            data: {
                tenantId: TENANT_ID,
                balance: 10000
            }
        });
    });

    it("Cenário 1: deve debitar R$ 6.000,00 de R$ 10.000,00 e restar R$ 4.000,00", async () => {
        const result = await useCase.executar({
            tenantId: TENANT_ID,
            amount: 6000,
            proposalId: "00000000-0000-0000-0000-000000000101"
        });

        expect(result.status).toBe("APPROVED");

        const fundoNoBanco = await prisma.fundo.findUnique({ where: { tenantId: TENANT_ID } });
        const contrato = await prisma.contrato.findFirst({ where: { proposalId: "00000000-0000-0000-0000-000000000101" } });
        expect(fundoNoBanco?.balance).toBe(4000);
        expect(contrato).toMatchObject({ tenantId: TENANT_ID, amount: 6000, status: "APPROVED" });

        const outboxEvent = await prisma.outboxEvent.findFirst({ where: { contractId: contrato!.id } });
        expect(outboxEvent).not.toBeNull();
        expect(outboxEvent!.status).toBe("PENDING");
        expect(outboxEvent!.eventType).toBe("CONTRACT_APPROVED");
        expect(outboxEvent!.idempotencyKey).toBe(contrato!.id);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});
