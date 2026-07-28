import { IWebhookFormatterStrategy } from "./webhook-formatter.strategy.js";
export class XmlWebhookFormatter implements IWebhookFormatterStrategy {
  format(payload: Record<string, any>): string {
    const rootName = 'webhookEvent';
    let xml = `<${rootName}>`;
    
    for (const [key, value] of Object.entries(payload)) {
      xml += `<${key}>${value}</${key}>`;
    }
    
    xml += `</${rootName}>`;
    return xml;
  }

  getContentType(): string {
    return 'application/xml';
  }
} 