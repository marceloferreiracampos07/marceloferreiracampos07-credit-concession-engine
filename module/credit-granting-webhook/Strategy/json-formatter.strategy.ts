import { IWebhookFormatterStrategy } from "./webhook-formatter.strategy.js";

export class JsonWebhookFormatter implements IWebhookFormatterStrategy {
  format(payload: Record<string, any>): string {
    return JSON.stringify(payload);
  }

  getContentType(): string {
    return 'application/json';
  }
}