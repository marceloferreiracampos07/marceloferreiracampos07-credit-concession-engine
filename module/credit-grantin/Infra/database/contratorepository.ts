import { Contrato } from "../../Domain/entities/Contrato.js";
import { IContratoRepository } from "../../Domain/repository/Icontratorepository.js";
import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { asPrismaTransaction } from "./transactionGuard.js";

export class ContratoRepository implements IContratoRepository {
    async save(contrato: Contrato, tx: ITransaction): Promise<void> {
        const { client } = asPrismaTransaction(tx);

        await client.contrato.create({
            data: {
                id: contrato.id,
                tenantId: contrato.tenantId,
                proposalId: contrato.proposalId,
                amount: contrato.amount,
                status: contrato.status,
                createdAt: contrato.createdAt,
            },
        });
    }
}
