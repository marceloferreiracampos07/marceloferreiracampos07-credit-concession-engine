import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { ReserveFundUseCase } from "../../application/Usecases/ReserveFundUseCase.js";
import { FundoRepository } from "../../Infra/database/fundorepository.js";
import { PrismaUnitOfWork } from "../../Infra/database/UnitOfWork.js";
import { prisma } from "../../Infra/database/prismaClient.js";
import { ContratoRepository } from "../../Infra/database/contratorepository.js";
import { OutboxEventRepository } from "../../Infra/database/outboxEventRepository.js";
import { TenantRepository } from "../../Infra/database/tenantRepository.js";

const TENANT_ID = "00000000-0000-0000-0000-000000000002";

describe("ReserveFundUseCase - Concorrência (Cenário 2)", () => {
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

        await prisma.outboxEvent.deleteMany({ where: { tenantId: TENANT_ID } });
        await prisma.contrato.deleteMany({ where: { tenantId: TENANT_ID } });
        await prisma.fundo.deleteMany({ where: { tenantId: TENANT_ID } });
        await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });

        await prisma.tenant.create({
            data: {
                id: TENANT_ID,
                name: "Tenant Concorrência",
                webhookUrl: "https://webhook.teste.com",
                webhookFormat: "JSON",
                webhookSecret: "secret",
            },
        });

        await prisma.fundo.create({
            data: { tenantId: TENANT_ID, balance: 10000 }
        });
    });

    it("Cenário 2: deve aprovar a primeira e rejeitar a segunda por saldo insuficiente sob concorrência", async () => {
        const input = { tenantId: TENANT_ID, amount: 6000 };

        const resultados = await Promise.allSettled([
            useCase.executar({ ...input, proposalId: randomUUID() }),
            useCase.executar({ ...input, proposalId: randomUUID() })
        ]);

        const aprovados = resultados.filter(r => r.status === "fulfilled");
        const rejeitados = resultados.filter(r => r.status === "rejected");

        expect(aprovados.length).toBe(1);
        expect(rejeitados.length).toBe(1);
        
        const erroRejeicao = (rejeitados[0] as PromiseRejectedResult).reason;
        expect(erroRejeicao.message).toContain("INSUFFICIENT_FUNDS");

        const fundoNoBanco = await prisma.fundo.findUnique({
            where: { tenantId: TENANT_ID }
        });
        
        expect(fundoNoBanco?.balance).toBe(4000);
        expect(await prisma.contrato.count({ where: { tenantId: TENANT_ID } })).toBe(1);

        const outboxEvents = await prisma.outboxEvent.findMany({ where: { tenantId: TENANT_ID } });
        expect(outboxEvents).toHaveLength(1);
        expect(outboxEvents[0].status).toBe("PENDING");
    });
});
