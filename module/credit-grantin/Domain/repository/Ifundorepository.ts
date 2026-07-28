import { Fundo } from "../entities/fundo.js";
import { ITransaction } from "../shared/ITransaction.js";

export interface IFundoRepository {
    findForUpdate(tenantId: string, tx: ITransaction): Promise<Fundo | null>;
    save(fundo: Fundo, tx: ITransaction): Promise<void>;
}
