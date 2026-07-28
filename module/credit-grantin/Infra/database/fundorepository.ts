import { Fundo } from "../../Domain/entities/fundo.js";
import { IFundoRepository } from "../../Domain/repository/Ifundorepository.js";
import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { asPrismaTransaction } from "./transactionGuard.js";

export class FundoRepository implements IFundoRepository {
    async findForUpdate(tenantId: string, tx: ITransaction): Promise<Fundo | null> {
        const { client } = asPrismaTransaction(tx);

        const result = await client.$queryRaw<{ tenantId: string; balance: number }[]>`
            SELECT "tenantId", "balance" FROM fundos 
            WHERE "tenantId" = ${tenantId} 
            FOR UPDATE
        `;

        const data = result[0];
        if (!data) {
            return null;
        }

        return new Fundo(data.tenantId, Number(data.balance));
    }

    async save(fundo: Fundo, tx: ITransaction): Promise<void> {
        const { client } = asPrismaTransaction(tx);

        await client.fundo.update({
            where: { tenantId: fundo.tenantId },
            data: { balance: fundo.saldo },
        });
    }
}
