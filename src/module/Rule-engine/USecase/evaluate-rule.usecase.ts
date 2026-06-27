import { EvaluateRuleInput, EvaluateRuleInputSchema } from "../dtos/evaluate-rule-input.dto";
import { EvaluateRuleOutput } from "../dtos/evaluate-rule-output.dto";
import { IRuleRepository } from "../repositories/irule.repository";
import { RuleNode } from "../types/rule-ast.types";
import { validateBorderData } from "../validators/border-validation";

export class EvaluateRuleUseCase {
  constructor(
    private readonly ruleRepository: IRuleRepository,
  ) {}

  async execute(entradadados: any): Promise<EvaluateRuleOutput> {
    try {

      const entrada = validateBorderData(EvaluateRuleInputSchema, entradadados);
      
      const ruleAst = await this.ruleRepository.findByTenantId(entrada.tenantId);
      
      if (!ruleAst) {
        return {
          resultado: "REJECTED",
          razao: "Não foi possível encontrar regras para este tenant id"
        };
      }

      const isApproved = this.evaluateNode(ruleAst, entrada);

      return {
        resultado: isApproved ? "APPROVED" : "REJECTED"
      };

    } catch (error: any) {
      return {
        resultado: "REJECTED",
        razao: error instanceof Error ? error.message : "Erro interno inesperado no motor de regras"
      };
    }
  }

  private evaluateNode(node: RuleNode, payload: any): boolean {
    // 1 aqui ocorre a validação se o agrupador logico é END
    if ("AND" in node && node.AND) {
      return node.AND.every(child => this.evaluateNode(child, payload));
    }

    // 2 nessa segunda validação é o OR mas ele so sera usado caso no futuro o banco quera uma nova regra nova 
    if ("OR" in node && node.OR) {
      return node.OR.some(child => this.evaluateNode(child, payload));
    }

    // 3 nessa validação ocorre a comparação se o valor da esquerda é MAIOR que o da direita
    if (">" in node && node[">"]) {
      const [left, right] = node[">"];
      return this.getValueByPath(payload, left) > (typeof right === "string" ? this.getValueByPath(payload, right) : right);
    }

    // 4 nessa validação ocorre a comparação se o valor da esquerda é MENOR que o da direita
    if ("<" in node && node["<"]) {
      const [left, right] = node["<"];
      return this.getValueByPath(payload, left) < (typeof right === "string" ? this.getValueByPath(payload, right) : right);
    }

    // 5 nessa validação ocorre a comparação se o valor da esquerda é IGUAL ao da direita
    if ("=" in node && node["="]) {
      const [left, right] = node["="];
      return this.getValueByPath(payload, left) === (typeof right === "string" ? this.getValueByPath(payload, right) : right);
    }

    // 6 nessa validação ocorre a comparação se o valor da esquerda é DIFERENTE do da direita
    if ("!=" in node && node["!="]) {
      const [left, right] = node["!="];
      return this.getValueByPath(payload, left) !== (typeof right === "string" ? this.getValueByPath(payload, right) : right);
    }

    // 7 caso o nó não corresponda a nenhum operador válido, retorna falso por segurança
    return false;
  }

  private getValueByPath(payload: any, path: string): any {
    const cleanPath = path.startsWith("$") ? path.slice(1) : path;
    const keys = cleanPath.split(".");

    return keys.reduce((currentObject, currentKey) => {
      if (currentObject === null || currentObject === undefined) {
        return undefined;
      }
      return currentObject[currentKey];
    }, payload);
  }
}