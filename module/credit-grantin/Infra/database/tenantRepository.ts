import { ITenantRepository, TenantWebhookConfig } from "../../Domain/repository/ITenantRepository.js";
import { ITransaction } from "../../Domain/shared/ITransaction.js";
import { asPrismaTransaction } from "./transactionGuard.js";

export class TenantRepository implements ITenantRepository {
  async findById(id: string, tx: ITransaction): Promise<TenantWebhookConfig | null> {
    const { client } = asPrismaTransaction(tx);

    const tenant = await client.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        webhookUrl: true,
        webhookFormat: true,
        webhookSecret: true,
      },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      webhookUrl: tenant.webhookUrl,
      webhookFormat: tenant.webhookFormat,
      webhookSecret: tenant.webhookSecret,
    };
  }
}
