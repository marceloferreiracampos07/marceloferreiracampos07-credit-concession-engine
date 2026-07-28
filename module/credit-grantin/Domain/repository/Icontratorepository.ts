import { Contrato } from "../entities/Contrato.js";
import { ITransaction } from "../shared/ITransaction.js";

export interface IContratoRepository {
    save(contrato: Contrato, tx: ITransaction): Promise<void>;
}
