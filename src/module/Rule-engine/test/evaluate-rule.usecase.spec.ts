import { describe, it, expect, vi } from 'vitest';
import { EvaluateRuleUseCase } from '../USecase/evaluate-rule.usecase';
import { IRuleRepository } from '../repositories/irule.repository'; 

describe('EvaluateRuleUseCase', () => {
  it('deve aprovar quando o payload satisfaz todas as regras (AND simples)', async () => {
    
    const mockRepository: IRuleRepository = {
      findByTenantId: vi.fn().mockResolvedValue({
        AND: [
          { "<": ["$loanAmount", 6000] },
          { ">": ["$client.score", 600] }
        ]
      })
    };

    const useCase = new EvaluateRuleUseCase(mockRepository);

    
    const result = await useCase.execute({
      tenantId: "123",
      loanAmount: 5000,
      client: { score: 700, income: 4000 }
    });

    
    expect(result.resultado).toBe("APPROVED");
  });
});
it('deve rejeitar graciosamente quando um campo exigido no payload está faltando', async () => {
  
  const mockRepository: IRuleRepository = {
    findByTenantId: vi.fn().mockResolvedValue({
      ">": ["$client.score", 600]
    })
  };
  const useCase = new EvaluateRuleUseCase(mockRepository);

  // 2. Act: Payload FALTANDO o campo 'client'
  const result = await useCase.execute({
    tenantId: "123",
    loanAmount: 5000
    // client está faltando aqui!
  });

  expect(result.resultado).toBe("REJECTED");
});
it('deve aprovar quando o payload satisfaz o AND que contém um OR dentro (Nested)', async () => {
  
  const mockRepository: IRuleRepository = {
    findByTenantId: vi.fn().mockResolvedValue({
      AND: [
        { "<": ["$loanAmount", 6000] },
        {
          OR: [
            { ">": ["$client.score", 600] },
            { ">": ["$client.income", 5000] }
          ]
        }
      ]
    })
  };

  const useCase = new EvaluateRuleUseCase(mockRepository);

  
  const result = await useCase.execute({
    tenantId: "123",
    loanAmount: 5000, 
    client: { 
      score: 500,     
      income: 6000    
    }
  });

  
  expect(result.resultado).toBe("APPROVED");
});
it('deve retornar REJECTED quando a regra contiver um operador inválido', async () => {
  const mockRepository: IRuleRepository = {
    findByTenantId: vi.fn().mockResolvedValue({
      XOR: [
        { ">": ["$loanAmount", 1000] },
        { "<": ["$loanAmount", 5000] }
      ]
    })
  };

  const useCase = new EvaluateRuleUseCase(mockRepository);

  const result = await useCase.execute({
    tenantId: "123",
    loanAmount: 3000,
    client: { score: 700, income: 4000 }
  });

  expect(result.resultado).toBe("REJECTED");
});
it('deve parar a avaliação imediatamente (curto-circuito) quando a primeira condição do AND falhar', async () => {
  const mockRepository: IRuleRepository = {
    findByTenantId: vi.fn().mockResolvedValue({
      AND: [
        { ">": ["$loanAmount", 999999] }, 
        { ">": ["$client.score", 0] }      
      ]
    })
  };

  const useCase = new EvaluateRuleUseCase(mockRepository);

  const result = await useCase.execute({
    tenantId: "123",
    loanAmount: 5000,
    client: { score: 0, income: 0 }
  });

  expect(result.resultado).toBe("REJECTED");
});