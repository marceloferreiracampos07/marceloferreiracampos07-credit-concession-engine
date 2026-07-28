import { OutboxEvent } from "../entities/OutboxEvent.js";
import { ITransaction } from "../shared/ITransaction.js";

export interface IOutboxEventRepository {
    save(event: OutboxEvent, tx: ITransaction): Promise<void>;
}
