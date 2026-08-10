import { describe, it, expect } from 'vitest';
import { WebhookFormatterFactory } from '../../Strategy/webhook-formatter.strategy.js';
import { JsonWebhookFormatter } from '../../Strategy/json-formatter.strategy.js';
import { XmlWebhookFormatter } from '../../Strategy/xml-formatter.strategy.js';

describe('WebhookFormatterFactory', () => {
  it('should return JsonWebhookFormatter for JSON format', () => {
    const formatter = WebhookFormatterFactory.getFormatter('JSON');
    expect(formatter).toBeInstanceOf(JsonWebhookFormatter);
  });

  it('should return XmlWebhookFormatter for XML format', () => {
    const formatter = WebhookFormatterFactory.getFormatter('XML');
    expect(formatter).toBeInstanceOf(XmlWebhookFormatter);
  });

  it('should format payload using correct strategy', () => {
    const payload = { key: 'value' };
    
    // JSON
    const jsonResult = WebhookFormatterFactory.format('JSON', payload);
    expect(typeof jsonResult).toBe('string');
    expect(jsonResult).toBe(JSON.stringify(payload));
    
    // XML
    const xmlResult = WebhookFormatterFactory.format('XML', payload);
    expect(typeof xmlResult).toBe('string');
    expect(xmlResult).toContain('<key>value</key>');
  });
});
