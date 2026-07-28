// Supondo que estamos usando Jest ou Vitest
import { JsonFormatterStrategy } from '../../Strategy/json-formatter.strategy.js';

describe('JsonFormatterStrategy', () => {
  let strategy: JsonFormatterStrategy;

  beforeEach(() => {
    strategy = new JsonFormatterStrategy();
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
