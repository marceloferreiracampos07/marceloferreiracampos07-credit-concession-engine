export interface IWebhookFormatterStrategy {
  format(payload: Record<string, any>): string;
  getContentType(): string;
}