export class Fundo {
    constructor(
        public readonly tenantId: string,
        private _saldo: number,           
    ) {
        this.validar();
    }

    public debitar(valor: number): void {
        if (this._saldo < valor) {
            throw new Error("FUNDO_INSUFICIENTE");
        }
        this._saldo -= valor;
    }

    public get saldo(): number {
        return this._saldo;
    }

    private validar(): void {
        if (this._saldo < 0) {
            throw new Error("O saldo inicial não pode ser negativo");
        }
    }
}