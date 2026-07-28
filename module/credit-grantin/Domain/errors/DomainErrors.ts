export abstract class DomainError extends Error {
    abstract readonly code: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class FundNotFoundError extends DomainError {
    readonly code = "FUND_NOT_FOUND";

    constructor() {
        super("Fundo não encontrado para o tenant informado.");
    }
}

export class TenantNotFoundError extends DomainError {
    readonly code = "TENANT_NOT_FOUND";

    constructor() {
        super("Tenant não encontrado.");
    }
}

export class InsufficientFundsError extends DomainError {
    readonly code = "INSUFFICIENT_FUNDS";

    constructor() {
        super("Saldo insuficiente para realizar a operação.");
    }
}

export class InvalidValueError extends DomainError {
    readonly code = "VALOR_INVALIDO";

    constructor() {
        super("O valor informado deve ser um inteiro positivo.");
    }
}

export class InvalidContractError extends DomainError {
    readonly code = "INVALID_CONTRACT";

    constructor(message: string) {
        super(message);
    }
}
