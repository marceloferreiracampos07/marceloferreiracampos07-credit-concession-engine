import { ReserveFundInput } from "../dto/ReserveFundInput";
import { ReserveFundOutput } from "../dto/ReserveFundOutput";
import { Contrato } from "../../Domain/entities/Contrato";
import { IFundoRepository } from "../../Domain/repository/Ifundorepository";
import { IContratoRepository } from "../../Domain/repository/Icontratorepository";

export class Reservefund {
    constructor(
        private fundorepositorio: IFundoRepository,
        private contratorepositorio: IContratoRepository
    ){}
   async executar(entrada: ReserveFundInput): Promise<ReserveFundOutput> {

    const fundo = await this.fundorepositorio.findForUpdate(entrada.tenantId);
    
    if (!fundo) {
        return { status: 'REJECTED', reason: 'FUNDO_NAO-ENCONTRADO' };
    }

    
    try {
        fundo.debitar(entrada.amount);
    } catch (erro: any) {
        return { status: 'REJECTED', reason: erro.message };
    }

    
    await this.fundorepositorio.save(fundo);

    
    const novoContrato = new Contrato(
        crypto.randomUUID(), 
        entrada.tenantId,
        entrada.amount,
        'APPROVED',
        new Date()
    );

    await this.contratorepositorio.save(novoContrato);
    
    return { status: 'APPROVED', contractId: novoContrato.id };
}
}