import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { ReserveFundUseCase } from "../../application/Usecases/ReserveFundUseCase.js";
import { FundoRepository } from "../../Infra/database/fundorepository.js";
import { PrismaUnitOfWork } from "../../Infra/database/UnitOfWork.js";
import { prisma } from "../../Infra/database/prismaClient.js";
import { ContratoRepository } from "../../Infra/database/contratorepository.js";
import { OutboxEventRepository } from "../../Infra/database/outboxEventRepository.js";
import { TenantRepository } from "../../Infra/database/tenantRepository.js";

const TENANT_ID = "00000000-0000-0000-0000-000000000003";

describe("ReserveFundUseCase - Estresse Concorrente (Cenário 3)", () => {
    let useCase: ReserveFundUseCase;
    let fundoRepo: FundoRepository;
    let contratoRepo: ContratoRepository;
    let outboxRepo: OutboxEventRepository;
    let tenantRepo: TenantRepository;
    let uow: PrismaUnitOfWork;
    const SALDO_INICIAL = 10000;

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
                name: "Tenant Estresse",
                webhookUrl: "https://webhook.teste.com",
                webhookFormat: "JSON",
                webhookSecret: "secret",
            },
        });

        await prisma.fundo.create({
            data: { tenantId: TENANT_ID, balance: SALDO_INICIAL }
        });
    });

    it("Cenário 3: deve processar 50 requisições sem exceder o saldo total do fundo", async () => {
        const TOTAL_REQUISICOES = 50;
        const VALOR_POR_REQUISICAO = 500;
        
        const inputs = Array.from({ length: TOTAL_REQUISICOES }).map(() => ({
            tenantId: TENANT_ID,
            amount: VALOR_POR_REQUISICAO,
            proposalId: randomUUID()
        }));

        const resultados = await Promise.allSettled(inputs.map((input) => useCase.executar(input)));

        const aprovados = resultados.filter(r => r.status === "fulfilled");
        const rejeitados = resultados.filter(r => r.status === "rejected");

        const esperadoSucesso = SALDO_INICIAL / VALOR_POR_REQUISICAO;
        
        expect(aprovados.length).toBe(esperadoSucesso);
        expect(rejeitados.length).toBe(TOTAL_REQUISICOES - esperadoSucesso);

        const fundoNoBanco = await prisma.fundo.findUnique({ where: { tenantId: TENANT_ID } });
        
        expect(fundoNoBanco?.balance).toBeGreaterThanOrEqual(0);
        expect(fundoNoBanco?.balance).toBeLessThan(VALOR_POR_REQUISICAO);
        expect(await prisma.contrato.count({ where: { tenantId: TENANT_ID } })).toBe(esperadoSucesso);

        const outboxEvents = await prisma.outboxEvent.findMany({ where: { tenantId: TENANT_ID } });
        expect(outboxEvents).toHaveLength(esperadoSucesso);
        expect(outboxEvents.every(e => e.status === "PENDING")).toBe(true);
    });
});
