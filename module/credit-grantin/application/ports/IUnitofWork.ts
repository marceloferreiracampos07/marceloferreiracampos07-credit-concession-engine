import { ITransaction } from "../../Domain/shared/ITransaction.js";

export type { ITransaction };

export interface IUnitOfWork {
    runInTransaction<T>(work: (tx: ITransaction) => Promise<T>): Promise<T>;
}
