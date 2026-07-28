import { describe, expect, it } from "vitest";
import { ReserveFundController } from "../../presentation/controller/ReserveFundController.js";
import { IReserveFundUseCase } from "../../application/ports/IReserveFundUseCase.js";
import { FundNotFoundError, InsufficientFundsError, TenantNotFoundError } from "../../Domain/errors/DomainErrors.js";

describe("ReserveFundController", () => {
    it("retorna 200 para uma reserva aprovada", async () => {
        const useCase = { executar: async () => ({ status: "APPROVED" as const, contractId: "contract-1" }) };
        const controller = new ReserveFundController(useCase as IReserveFundUseCase);

        const response = await controller.handle({ body: { tenantId: "00000000-0000-0000-0000-000000000001", proposalId: "00000000-0000-0000-0000-000000000002", amount: 100 } });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "APPROVED", contractId: "contract-1" });
    });

    it("retorna 422 para saldo insuficiente", async () => {
        const useCase = { executar: async () => { throw new InsufficientFundsError(); } };
        const controller = new ReserveFundController(useCase as IReserveFundUseCase);

        const response = await controller.handle({ body: { tenantId: "00000000-0000-0000-0000-000000000001", proposalId: "00000000-0000-0000-0000-000000000002", amount: 100 } });

        expect(response.statusCode).toBe(422);
        expect(response.body).toEqual({ error: "INSUFFICIENT_FUNDS" });
    });

    it("retorna 400 para dados inválidos (ZodError)", async () => {
        const useCase = { executar: async () => ({}) };
        const controller = new ReserveFundController(useCase as unknown as IReserveFundUseCase);

        const response = await controller.handle({ body: { tenantId: "invalid", proposalId: "nope", amount: -5 } });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("error", "Dados inválidos");
    });

    it("retorna 404 quando o fundo não existe", async () => {
        const useCase = { executar: async () => { throw new FundNotFoundError(); } };
        const controller = new ReserveFundController(useCase as IReserveFundUseCase);

        const response = await controller.handle({ body: { tenantId: "00000000-0000-0000-0000-000000000001", proposalId: "00000000-0000-0000-0000-000000000002", amount: 100 } });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ error: "FUND_NOT_FOUND" });
    });

    it("retorna 404 quando o tenant não existe", async () => {
        const useCase = { executar: async () => { throw new TenantNotFoundError(); } };
        const controller = new ReserveFundController(useCase as IReserveFundUseCase);

        const response = await controller.handle({ body: { tenantId: "00000000-0000-0000-0000-000000000001", proposalId: "00000000-0000-0000-0000-000000000002", amount: 100 } });

        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ error: "TENANT_NOT_FOUND" });
    });

    it("retorna 500 para erros desconhecidos sem vazar detalhes", async () => {
        const useCase = { executar: async () => { throw new Error("something unexpected"); } };
        const controller = new ReserveFundController(useCase as IReserveFundUseCase);

        const response = await controller.handle({ body: { tenantId: "00000000-0000-0000-0000-000000000001", proposalId: "00000000-0000-0000-0000-000000000002", amount: 100 } });

        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: "Erro interno do servidor" });
    });
});
