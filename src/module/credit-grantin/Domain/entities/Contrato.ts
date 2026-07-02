export type ContratoStatus = 'APPROVED' | 'REJECTED';

export class Contrato {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly amount: number,
        public readonly status: ContratoStatus,
        public readonly createdAt: Date
    ) {
        this.validar();
    }

    private validar(): void {
        if (this.amount <= 0) {
            throw new Error("O valor do contrato deve ser maior que zero.");
        }
        if (!this.tenantId) {
            throw new Error("Contrato deve estar vinculado a um Tenant.");
        }
    }
    
    
}