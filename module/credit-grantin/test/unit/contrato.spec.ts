import { describe, expect, it } from "vitest";
import { Contrato } from "../../Domain/entities/Contrato.js";
import { InvalidContractError } from "../../Domain/errors/DomainErrors.js";

describe("Entidade Contrato", () => {
    it("cria contrato aprovado com valor inteiro em centavos", () => {
        const contrato = new Contrato("contract-1", "tenant-1", "proposal-1", 500, "APPROVED", new Date());
        expect(contrato.amount).toBe(500);
    });

    it("não aceita valor fracionado", () => {
        expect(() => new Contrato("contract-1", "tenant-1", "proposal-1", 10.5, "APPROVED", new Date()))
            .toThrow(InvalidContractError);
    });
});
