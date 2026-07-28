import { IUnitOfWork, ITransaction } from "../../application/ports/IUnitofWork.js";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export class PrismaTransaction implements ITransaction {
    constructor(public readonly client: Prisma.TransactionClient) {}
}

export class PrismaUnitOfWork implements IUnitOfWork {
    constructor(private readonly prisma: PrismaClient) {}

    async runInTransaction<T>(work: (tx: ITransaction) => Promise<T>): Promise<T> {
        return this.prisma.$transaction((prismaClient: Prisma.TransactionClient) =>
            work(new PrismaTransaction(prismaClient))
        );
    }
}
