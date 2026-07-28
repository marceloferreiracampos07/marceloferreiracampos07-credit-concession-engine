import { describe, it, expect, beforeEach } from 'vitest';
import { ValidadorSemanticoRegra } from '../validators/rule-semantic.validator.js';
import { RuleNode } from '../types/rule-ast.types.js';
import { SemanticRuleException } from '../exceptions/domain.exceptions.js';

describe('ValidadorSemanticoRegra', () => {
  let validador: ValidadorSemanticoRegra;

  beforeEach(() => {
    validador = new ValidadorSemanticoRegra();
  });

  it('deve passar em uma arvore perfeitamente valida', () => {
    const ast: RuleNode = {
      AND: [
        { '>': ['$user.score', 600] },
        { OR: [
          { '<': ['$loanAmount', '$user.income'] },
          { '=': ['$user.status', 1] }
        ]}
      ]
    };
    expect(() => validador.validar(ast)).not.toThrow();
  });

  it('deve falhar se o no tiver multiplas chaves de operacao', () => {
    const ast = { '>': ['$user.score', 600], '<': ['$loan', 1000] } as any;
    expect(() => validador.validar(ast)).toThrowError(SemanticRuleException);
  });

  it('deve falhar se a chave for um operador desconhecido', () => {
    const ast = { 'XOR': [] } as any;
    expect(() => validador.validar(ast)).toThrowError(SemanticRuleException);
  });

  it('deve falhar se o operando esquerdo da comparacao nao comecar com $', () => {
    const ast: RuleNode = { '>': ['user.score', 600] }; // Falta o cifrao
    expect(() => validador.validar(ast)).toThrowError(SemanticRuleException);
  });

  it('deve falhar se o no logico nao for array', () => {
    const ast = { 'AND': { '>': ['$x', 1] } } as any; // Deveria ser array
    expect(() => validador.validar(ast)).toThrowError(SemanticRuleException);
  });

  it('deve falhar se a comparacao nao tiver exatamente 2 operandos', () => {
    const ast: any = { '>': ['$x'] }; // Apenas 1 operando
    expect(() => validador.validar(ast)).toThrowError(SemanticRuleException);
  });

  it('deve passar com outros operadores de comparacao (<, =, !=)', () => {
    const ast1: RuleNode = { '<': ['$loanAmount', 5000] };
    const ast2: RuleNode = { '=': ['$user.status', '$other.field'] };
    const ast3: RuleNode = { '!=': ['$user.role', 10] };
    
    expect(() => validador.validar(ast1)).not.toThrow();
    expect(() => validador.validar(ast2)).not.toThrow();
    expect(() => validador.validar(ast3)).not.toThrow();
  });
});
