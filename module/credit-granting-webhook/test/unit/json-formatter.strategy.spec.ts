import { describe, it, expect, beforeEach } from 'vitest';
import { JsonWebhookFormatter } from '../../Strategy/json-formatter.strategy.js';

describe('JsonWebhookFormatter', () => {
  let strategy: JsonWebhookFormatter;

  beforeEach(() => {
    strategy = new JsonWebhookFormatter();
  });

  it('deve retornar application/json como contentType', () => {
    expect(strategy.getContentType()).toBe('application/json');
  });

  it('deve formatar o payload corretamente para uma string JSON', () => {
    const payload = { contratoId: 999, status: 'APPROVED' };
    const result = strategy.format(payload);
    
    expect(result).toBe('{"contratoId":999,"status":"APPROVED"}');
  });
});
