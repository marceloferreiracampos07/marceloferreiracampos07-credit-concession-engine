import { any } from "zod";
import { Fundo } from "../../Domain/entities/fundo";
import { IFundoRepository } from "../../Domain/repository/Ifundorepository";
import { PrismaClient } from "@prisma/client";
import { FundoDatabaseRecord } from "./types/fundomodel";

export class FundoRepository implements IFundoRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findForUpdate(tenantId: string, tx?: any): Promise<Fundo> {
    const client = tx ?? this.prisma;
    
    const result = await client.$queryRaw<FundoDatabaseRecord[]>`
        SELECT * FROM fundos 
        WHERE "tenant_id" = ${tenantId} 
        FOR UPDATE
    `;

    
    const data = result[0];


    if (!data) {
        throw new Error(`Fundo não encontrado para o tenantId: ${tenantId}`);
    }


    return new Fundo(data.tenant_id, data.balance);
}

    async save(fundo: Fundo, tx?: any): Promise<void> {
        const client = tx ?? this.prisma;

        await client.fundo.upsert({
            where: { tenantId: fundo.tenantId },
            update: { 
                balance: fundo.saldo,
                updatedAt: new Date() 
            
            },
            create: {
                tenantId: fundo.tenantId,
                balance: fundo.saldo
            }
        });
    }
}