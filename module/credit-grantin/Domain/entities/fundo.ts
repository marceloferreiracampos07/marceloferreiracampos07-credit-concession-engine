import { InvalidValueError, InsufficientFundsError } from "../errors/DomainErrors.js";

export class Fundo {
    constructor(
        public readonly tenantId: string,
        private _saldo: number,
    ) {
        this.validar();
    }

    public debitar(valor: number): void {
        if (!Number.isSafeInteger(valor) || valor <= 0) {
            throw new InvalidValueError();
        }
        if (this._saldo < valor) {
            throw new InsufficientFundsError();
        }
        this._saldo -= valor;
    }

    public get saldo(): number {
        return this._saldo;
    }

    private validar(): void {
        if (!Number.isInteger(this._saldo) || this._saldo < 0) {
            throw new Error("O saldo inicial não pode ser negativo.");
        }
    }
}
