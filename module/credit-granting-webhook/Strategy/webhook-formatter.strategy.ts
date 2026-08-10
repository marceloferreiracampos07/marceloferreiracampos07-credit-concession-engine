export interface IWebhookFormatterStrategy {
  format(payload: Record<string, any>): string;
  getContentType(): string;
}

import { JsonWebhookFormatter } from './json-formatter.strategy.js';
import { XmlWebhookFormatter } from './xml-formatter.strategy.js';
import { TenantFormat } from '../domain/outbox-event.entity.js';

export class WebhookFormatterFactory {
  static getFormatter(format: TenantFormat): IWebhookFormatterStrategy {
    if (format === 'XML') {
      return new XmlWebhookFormatter();
    }
    return new JsonWebhookFormatter();
  }

  static format(format: TenantFormat, payload: Record<string, any>): string {
    return this.getFormatter(format).format(payload);
  }
}