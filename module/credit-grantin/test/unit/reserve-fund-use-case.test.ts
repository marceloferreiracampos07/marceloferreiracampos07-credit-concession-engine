import { describe, expect, it } from "vitest";
import { Fundo } from "../../Domain/entities/fundo.js";
import { Contrato } from "../../Domain/entities/Contrato.js";
import { OutboxEvent } from "../../Domain/entities/OutboxEvent.js";
import { IFundoRepository } from "../../Domain/repository/Ifundorepository.js";
import { IContratoRepository } from "../../Domain/repository/Icontratorepository.js";
import { IOutboxEventRepository } from "../../Domain/repository/IOutboxEventRepository.js";
import { ITenantRepository, TenantWebhookConfig } from "../../Domain/repository/ITenantRepository.js";
import { IUnitOfWork } from "../../application/ports/IUnitofWork.js";
import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { ReserveFundUseCase } from "../../application/Usecases/ReserveFundUseCase.js";
import { EVENT_TYPES } from "../../Domain/constants/EventTypes.js";
import { InsufficientFundsError, FundNotFoundError, TenantNotFoundError } from "../../Domain/errors/DomainErrors.js";

class FundoRepositoryFake implements IFundoRepository {
    constructor(public fundo: Fundo | null) {}

    async findForUpdate(_tenantId: string, _tx: ITransaction): Promise<Fundo | null> {
        return this.fundo;
    }

    async save(fundo: Fundo, _tx: ITransaction): Promise<void> {
        this.fundo = fundo;
    }
}

class ContratoRepositoryFake implements IContratoRepository {
    public contratos: Contrato[] = [];

    async save(contrato: Contrato, _tx: ITransaction): Promise<void> {
        this.contratos.push(contrato);
    }
}

class OutboxEventRepositoryFake implements IOutboxEventRepository {
    public events: OutboxEvent[] = [];

    async save(event: OutboxEvent, _tx: ITransaction): Promise<void> {
        this.events.push(event);
    }
}

class TenantRepositoryFake implements ITenantRepository {
    constructor(private readonly tenants: TenantWebhookConfig[]) {}

    async findById(id: string, _tx: ITransaction): Promise<TenantWebhookConfig | null> {
        return this.tenants.find(t => t.id === id) ?? null;
    }
}

class UnitOfWorkFake implements IUnitOfWork {
    async runInTransaction<T>(work: (tx: ITransaction) => Promise<T>): Promise<T> {
        return work({});
    }
}

const DEFAULT_TENANT: TenantWebhookConfig = {
    id: "tenant-1",
    name: "Tenant Teste",
    webhookUrl: "https://webhook.teste.com",
    webhookFormat: "JSON",
    webhookSecret: "secret",
};

describe("ReserveFundUseCase", () => {
    it("debita o fundo e registra um contrato aprovado", async () => {
        const fundoRepository = new FundoRepositoryFake(new Fundo("tenant-1", 10_000));
        const contratoRepository = new ContratoRepositoryFake();
        const outboxRepository = new OutboxEventRepositoryFake();
        const tenantRepository = new TenantRepositoryFake([DEFAULT_TENANT]);
        const useCase = new ReserveFundUseCase(fundoRepository, contratoRepository, outboxRepository, tenantRepository, new UnitOfWorkFake());

        const result = await useCase.executar({ tenantId: "tenant-1", proposalId: "proposal-1", amount: 6_000 });

        expect(result.status).toBe("APPROVED");
        expect(result.contractId).toBeDefined();
        expect(fundoRepository.fundo?.saldo).toBe(4_000);
        expect(contratoRepository.contratos).toHaveLength(1);
        expect(contratoRepository.contratos[0]).toMatchObject({ proposalId: "proposal-1", amount: 6_000, status: "APPROVED" });
    });

    it("cria um evento outbox PENDING ao aprovar o contrato", async () => {
        const fundoRepository = new FundoRepositoryFake(new Fundo("tenant-1", 10_000));
        const contratoRepository = new ContratoRepositoryFake();
        const outboxRepository = new OutboxEventRepositoryFake();
        const tenantRepository = new TenantRepositoryFake([DEFAULT_TENANT]);
        const useCase = new ReserveFundUseCase(fundoRepository, contratoRepository, outboxRepository, tenantRepository, new UnitOfWorkFake());

        const result = await useCase.executar({ tenantId: "tenant-1", proposalId: "proposal-1", amount: 6_000 });

        expect(outboxRepository.events).toHaveLength(1);
        const evento = outboxRepository.events[0];
        expect(evento.tenantId).toBe("tenant-1");
        expect(evento.contractId).toBe(result.contractId);
        expect(evento.eventType).toBe(EVENT_TYPES.CONTRACT_APPROVED);
        expect(evento.status).toBe("PENDING");
        expect(evento.idempotencyKey).toBe(result.contractId);
        expect(evento.attempts).toBe(0);
        expect(evento.nextAttemptAt).toBeNull();
        expect(evento.payload).toMatchObject({
            contractId: result.contractId,
            tenantId: "tenant-1",
            proposalId: "proposal-1",
            amount: 6_000,
            status: "APPROVED",
        });
    });

    it("rejeita saldo insuficiente sem registrar contrato nem evento outbox", async () => {
        const fundoRepository = new FundoRepositoryFake(new Fundo("tenant-1", 1_000));
        const contratoRepository = new ContratoRepositoryFake();
        const outboxRepository = new OutboxEventRepositoryFake();
        const tenantRepository = new TenantRepositoryFake([DEFAULT_TENANT]);
        const useCase = new ReserveFundUseCase(fundoRepository, contratoRepository, outboxRepository, tenantRepository, new UnitOfWorkFake());

        await expect(useCase.executar({ tenantId: "tenant-1", proposalId: "proposal-1", amount: 2_000 }))
            .rejects.toThrow(InsufficientFundsError);
        expect(contratoRepository.contratos).toHaveLength(0);
        expect(outboxRepository.events).toHaveLength(0);
    });

    it("informa quando o fundo não existe", async () => {
        const outboxRepository = new OutboxEventRepositoryFake();
        const tenantRepository = new TenantRepositoryFake([DEFAULT_TENANT]);
        const useCase = new ReserveFundUseCase(new FundoRepositoryFake(null), new ContratoRepositoryFake(), outboxRepository, tenantRepository, new UnitOfWorkFake());

        await expect(useCase.executar({ tenantId: "missing", proposalId: "proposal-1", amount: 1 }))
            .rejects.toThrow(FundNotFoundError);
        expect(outboxRepository.events).toHaveLength(0);
    });

    it("informa quando o tenant não existe", async () => {
        const fundoRepository = new FundoRepositoryFake(new Fundo("tenant-1", 10_000));
        const outboxRepository = new OutboxEventRepositoryFake();
        const tenantRepository = new TenantRepositoryFake([]);
        const useCase = new ReserveFundUseCase(fundoRepository, new ContratoRepositoryFake(), outboxRepository, tenantRepository, new UnitOfWorkFake());

        await expect(useCase.executar({ tenantId: "tenant-1", proposalId: "proposal-1", amount: 1_000 }))
            .rejects.toThrow(TenantNotFoundError);
        expect(fundoRepository.fundo?.saldo).toBe(10_000);
        expect(outboxRepository.events).toHaveLength(0);
    });
});
