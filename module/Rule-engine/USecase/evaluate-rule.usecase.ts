import { EvaluateRuleInput } from "../dtos/evaluate-rule-input.dto.js";
import { EvaluateRuleOutput } from "../dtos/evaluate-rule-output.dto.js";
import { IRuleRepository } from "../repositories/irule.repository.js";
import { ISemanticValidator } from "../validators/isemantic-validator.js";
import { IMotorRegras } from "../core/imotor-regras.js"; 
import { DomainException } from "../exceptions/domain.exceptions.js";

export class EvaluateRuleUseCase {
  constructor(
    private readonly ruleRepository: IRuleRepository,
    private readonly validadorSemantico: ISemanticValidator,
    private readonly motor: IMotorRegras 
  ) {}

  async execute(entrada: EvaluateRuleInput): Promise<EvaluateRuleOutput> {
    try {
      const astRegra = await this.ruleRepository.findByTenantId(entrada.tenantId);

      if (!astRegra) {
        return {
          resultado: "REJECTED",
          razao: "Não foi possível encontrar regras para este tenant id"
        };
      }

      this.validadorSemantico.validar(astRegra);

      const aprovado = this.motor.avaliar(astRegra, entrada);

      return {
        resultado: aprovado ? "APPROVED" : "REJECTED"
      };

    } catch (erro: unknown) {
      if (erro instanceof DomainException) {
        return {
          resultado: "REJECTED",
          razao: erro.message
        };
      }
      
      const mensagemFalha = erro instanceof Error ? erro.message : String(erro);
      return {
        resultado: "REJECTED",
        razao: `Falha de Infraestrutura ou Erro Interno: ${mensagemFalha}`
      };
    }
  }
}