import { ContratoStatus } from "../constants/ContractStatus.js";
import { InvalidContractError } from "../errors/DomainErrors.js";

export class Contrato {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly proposalId: string,
        public readonly amount: number,
        public readonly status: ContratoStatus,
        public readonly createdAt: Date
    ) {
        this.validar();
    }

    private validar(): void {
        if (!this.id) {
            throw new InvalidContractError("Contrato deve possuir um identificador.");
        }
        if (!this.tenantId) {
            throw new InvalidContractError("Contrato deve estar vinculado a um Tenant.");
        }
        if (!this.proposalId) {
            throw new InvalidContractError("Contrato deve estar vinculado a uma proposta.");
        }
        if (!Number.isSafeInteger(this.amount) || this.amount <= 0) {
            throw new InvalidContractError("O valor do contrato deve ser um inteiro positivo.");
        }
    }
}
