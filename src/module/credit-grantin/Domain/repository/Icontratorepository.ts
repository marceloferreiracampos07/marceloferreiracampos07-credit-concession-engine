import { Contrato } from "../entities/Contrato";

export interface IContratoRepository {
    save(contrato: Contrato, tx?: any): Promise<void>;
}