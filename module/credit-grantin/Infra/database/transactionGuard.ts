import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { PrismaTransaction } from "./UnitOfWork.js";

export function asPrismaTransaction(tx: ITransaction): PrismaTransaction {
    if (!(tx instanceof PrismaTransaction)) {
        throw new Error("Transaction must be a PrismaTransaction instance");
    }
    return tx;
}
