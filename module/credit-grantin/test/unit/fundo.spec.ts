import { describe, it, expect } from 'vitest';
import { Fundo } from '../../Domain/entities/fundo.js';
import { InvalidValueError, InsufficientFundsError } from '../../Domain/errors/DomainErrors.js';

describe('Fundo Entity', () => {
    it('deve criar um fundo com sucesso', () => {
        const fundo = new Fundo('tenant-1', 100);
        expect(fundo.tenantId).toBe('tenant-1');
        expect(fundo.saldo).toBe(100);
    });

    it('não deve permitir saldo inicial negativo', () => {
        expect(() => new Fundo('tenant-1', -50)).toThrow('O saldo inicial não pode ser negativo');
    });

    it('deve debitar o saldo com sucesso', () => {
        const fundo = new Fundo('tenant-1', 100);
        fundo.debitar(40);
        expect(fundo.saldo).toBe(60);
    });

    it('não deve permitir debitar um valor negativo ou zero', () => {
        const fundo = new Fundo('tenant-1', 100);
        expect(() => fundo.debitar(0)).toThrow(InvalidValueError);
        expect(() => fundo.debitar(-10)).toThrow(InvalidValueError);
    });

    it('não deve permitir debitar valor maior que o saldo', () => {
        const fundo = new Fundo('tenant-1', 100);
        expect(() => fundo.debitar(150)).toThrow(InsufficientFundsError);
    });
});
