import { describe, it, expect, beforeEach } from 'vitest';
import { XmlWebhookFormatter } from '../../Strategy/xml-formatter.strategy.js';

describe('XmlWebhookFormatter', () => {
  let strategy: XmlWebhookFormatter;

  beforeEach(() => {
    strategy = new XmlWebhookFormatter();
  });

  it('deve retornar application/xml como contentType', () => {
    expect(strategy.getContentType()).toBe('application/xml');
  });

  it('deve formatar o payload corretamente para uma string XML', () => {
    const payload = { contratoId: 999, status: 'APPROVED' };
    const result = strategy.format(payload);
    
    expect(result).toContain('<contratoId>999</contratoId>');
    expect(result).toContain('<status>APPROVED</status>');
  });
});
