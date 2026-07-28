import { describe, it, expect, beforeEach } from 'vitest';
import { MotorRegras } from '../core/motor-regras.js';
import { RuleNode } from '../types/rule-ast.types.js';
import { MissingDataException, RuleExecutionException } from '../exceptions/domain.exceptions.js';

describe('MotorRegras', () => {
  let motor: MotorRegras;

  beforeEach(() => {
    motor = new MotorRegras();
  });

  const payload = {
    user: { age: 30, income: 5000 },
    loan: 2000,
  };

  it('deve avaliar um no basico de comparacao corretamente (>)', () => {
    const ast: RuleNode = { '>': ['$user.age', 18] };
    expect(motor.avaliar(ast, payload)).toBe(true);
  });

  it('deve avaliar falso se comparacao falhar (<)', () => {
    const ast: RuleNode = { '<': ['$loan', 1000] };
    expect(motor.avaliar(ast, payload)).toBe(false);
  });

  it('deve resolver propriedades complexas aninhadas e logica AND', () => {
    const ast: RuleNode = {
      AND: [
        { '>': ['$user.income', 4000] },
        { '=': ['$loan', 2000] },
      ],
    };
    expect(motor.avaliar(ast, payload)).toBe(true);
  });

  it('deve avaliar corretamente quando o operando direito tambem e uma variavel do payload (string)', () => {
    const ast: RuleNode = { '<': ['$loan', '$user.income'] };
    expect(motor.avaliar(ast, payload)).toBe(true);
  });

  it('deve resolver logica OR e curto-circuito', () => {
    const ast: RuleNode = {
      OR: [
        { '<': ['$user.age', 18] }, // false
        { '>': ['$user.income', 1000] }, // true
      ],
    };
    expect(motor.avaliar(ast, payload)).toBe(true);
  });

  it('deve disparar MissingDataException se um campo nao existir no payload', () => {
    const ast: RuleNode = { '>': ['$user.score', 500] };
    expect(() => motor.avaliar(ast, payload)).toThrow(MissingDataException);
  });

  it('deve avaliar igualdade (=)', () => {
    const ast: RuleNode = { '=': ['$user.age', 30] };
    expect(motor.avaliar(ast, payload)).toBe(true);
  });

  it('deve avaliar diferenca (!=)', () => {
    const ast: RuleNode = { '!=': ['$user.age', 25] };
    expect(motor.avaliar(ast, payload)).toBe(true);
  });

  it('deve disparar RuleExecutionException para operador invalido', () => {
    // Usamos 'any' para simular um banco de dados enviando lixo nao validado
    const ast = { 'XOR': ['$user.age', 18] } as any;
    expect(() => motor.avaliar(ast, payload)).toThrow(RuleExecutionException);
  });
});
