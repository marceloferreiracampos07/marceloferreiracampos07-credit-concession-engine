import { z } from 'zod';

// Camada 1: Proteção de Borda (Validação Sintética)
export const EvaluateRuleInputSchema = z.object({
  tenantId: z
    .string() 
    .trim()
    .min(1, "Tenant ID é obrigatório e não pode estar vazio"),
    
  loanAmount: z
    .number() 
    .positive("O valor do empréstimo solicitado deve ser maior que zero"),
    
  client: z.object({
    score: z
      .number()
      .nonnegative("O score de crédito não pode ser um valor negativo"),
      
    income: z
      .number()
      .positive("A renda mensal do cliente deve ser maior que zero"),
  }),
});

export type EvaluateRuleInput = z.infer<typeof EvaluateRuleInputSchema>;