// Supondo que estamos usando Jest ou Vitest
import { XmlFormatterStrategy } from '../../Strategy/xml-formatter.strategy.js';

describe('XmlFormatterStrategy', () => {
  let strategy: XmlFormatterStrategy;

  beforeEach(() => {
    strategy = new XmlFormatterStrategy();
  });

  it('deve retornar application/xml como contentType', () => {
    expect(strategy.getContentType()).toBe('application/xml');
  });

  it('deve formatar o payload corretamente para uma string XML', () => {
    const payload = { contratoId: 999, status: 'APPROVED' };
    const result = strategy.format(payload);
    
    // A implementação real do seu XML formatter vai ditar essa string
    // Esse é um exemplo de assert para uma estrutura básica XML
    expect(result).toContain('<contratoId>999</contratoId>');
    expect(result).toContain('<status>APPROVED</status>');
  });
});
