import { IUnitofWork } from "../../application/ports/IUnitofWork";
import { PrismaClient } from "@prisma/client";

export class PrismaUnitOfWork implements IUnitofWork {
    constructor(private prisma: PrismaClient) {}

    async runInTransaction<T>(work: (tx: any) => Promise<T>): Promise<T> {
        
        return await this.prisma.$transaction(async (tx:any) => {
            return await work(tx);
        });
    }
}