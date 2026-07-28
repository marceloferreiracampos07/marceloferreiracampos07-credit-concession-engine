import { ITransaction } from "../shared/ITransaction.js";

export interface TenantWebhookConfig {
  id: string;
  name: string;
  webhookUrl: string;
  webhookFormat: string;
  webhookSecret: string;
}

export interface ITenantRepository {
  findById(id: string, tx: ITransaction): Promise<TenantWebhookConfig | null>;
}
