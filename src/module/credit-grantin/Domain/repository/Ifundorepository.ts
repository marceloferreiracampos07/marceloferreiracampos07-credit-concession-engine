import { Fundo } from "../entities/fundo";

export interface IFundoRepository {
    findForUpdate(tenantId: string, tx?: any): Promise<Fundo | null>;
    save(fundo: Fundo, tx?: any): Promise<void>;
}