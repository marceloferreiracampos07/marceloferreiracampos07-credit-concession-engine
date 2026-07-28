import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvaluateRuleUseCase } from '../USecase/evaluate-rule.usecase.js';
import { IRuleRepository } from '../repositories/irule.repository.js';
import { ISemanticValidator } from '../validators/isemantic-validator.js';
import { IMotorRegras } from '../core/imotor-regras.js';
import { EvaluateRuleInput } from '../dtos/evaluate-rule-input.dto.js';
import { SemanticRuleException } from '../exceptions/domain.exceptions.js';

describe('EvaluateRuleUseCase', () => {
  let useCase: EvaluateRuleUseCase;
  let mockRuleRepository: import('vitest').Mocked<IRuleRepository>;
  let mockValidator: import('vitest').Mocked<ISemanticValidator>;
  let mockMotor: import('vitest').Mocked<IMotorRegras>;

  beforeEach(() => {
    mockRuleRepository = {
      findByTenantId: vi.fn(),
    };
    mockValidator = {
      validar: vi.fn(),
    };
    mockMotor = {
      avaliar: vi.fn(),
    };

    useCase = new EvaluateRuleUseCase(
      mockRuleRepository,
      mockValidator,
      mockMotor
    );
  });

  const mockInput: EvaluateRuleInput = {
    tenantId: 'tenant-123',
    loanAmount: 1000,
    client: { score: 700, income: 5000 },
  };

  const mockAst = { AND: [{ '>': ['$client.score', 600] }] };

  it('deve retornar REJECTED se a regra nao for encontrada no banco', async () => {
    mockRuleRepository.findByTenantId.mockResolvedValue(null);

    const result = await useCase.execute(mockInput);

    expect(result).toEqual({
      resultado: 'REJECTED',
      razao: 'Não foi possível encontrar regras para este tenant id',
    });
    expect(mockValidator.validar).not.toHaveBeenCalled();
  });

  it('deve aprovar se a regra for valida e o motor retornar true', async () => {
    mockRuleRepository.findByTenantId.mockResolvedValue(mockAst);
    mockMotor.avaliar.mockReturnValue(true);

    const result = await useCase.execute(mockInput);

    expect(mockValidator.validar).toHaveBeenCalledWith(mockAst);
    expect(mockMotor.avaliar).toHaveBeenCalledWith(mockAst, mockInput);
    expect(result).toEqual({ resultado: 'APPROVED' });
  });

  it('deve rejeitar se a regra for valida mas o motor retornar false', async () => {
    mockRuleRepository.findByTenantId.mockResolvedValue(mockAst);
    mockMotor.avaliar.mockReturnValue(false);

    const result = await useCase.execute(mockInput);

    expect(result).toEqual({ resultado: 'REJECTED' });
  });

  it('deve tratar e retornar REJECTED graceful se houver uma falha de dominio (DomainException)', async () => {
    mockRuleRepository.findByTenantId.mockResolvedValue(mockAst);
    mockValidator.validar.mockImplementation(() => {
      throw new SemanticRuleException('Regra invalida mock');
    });

    const result = await useCase.execute(mockInput);

    expect(result).toEqual({
      resultado: 'REJECTED',
      razao: 'Regra invalida mock',
    });
  });

  it('deve retornar REJECTED para erro generico/infraestrutura sem estourar exception', async () => {
    mockRuleRepository.findByTenantId.mockRejectedValue(new Error('Falha no DB'));

    const result = await useCase.execute(mockInput);

    expect(result).toEqual({
      resultado: 'REJECTED',
      razao: 'Falha de Infraestrutura ou Erro Interno: Falha no DB',
    });
  });
});
