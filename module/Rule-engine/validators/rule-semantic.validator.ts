import { RuleNode } from "../types/rule-ast.types.js";
import { ISemanticValidator } from "./isemantic-validator.js";
import { SemanticRuleException } from "../exceptions/domain.exceptions.js";

export class ValidadorSemanticoRegra implements ISemanticValidator {
  private readonly ESTRATEGIAS: Record<string, (corpo: any, chave: string) => void> = {
    AND: (filhos, chave) => this.validarNoLogico(filhos, chave),
    OR:  (filhos, chave) => this.validarNoLogico(filhos, chave),
    ">":  (valores, chave) => this.validarNoComparacao(valores, chave),
    "<":  (valores, chave) => this.validarNoComparacao(valores, chave),
    "=":  (valores, chave) => this.validarNoComparacao(valores, chave),
    "!=": (valores, chave) => this.validarNoComparacao(valores, chave),
  };

  public validar(no: RuleNode): void {
    const chaves = Object.keys(no);

    this.executarValidacoes([
      {
        invalido: chaves.length !== 1,
        erro: `Regra corrompida: Cada nó da árvore deve conter exatamente 1 operador. Encontrado: ${chaves.length}.`
      }
    ]);

    const chave = chaves[0];
    const estrategia = this.ESTRATEGIAS[chave];

    this.executarValidacoes([
      {
        invalido: !estrategia,
        erro: `Regra corrompida: Operador inválido '${chave}' detectado na árvore.`
      }
    ]);

    estrategia(no[chave as keyof RuleNode], chave);
  }

  private validarNoLogico(filhos: any, chave: string): void {
    this.executarValidacoes([
      {
        invalido: !Array.isArray(filhos) || filhos.length === 0,
        erro: `Regra corrompida: O nó lógico '${chave}' deve conter um array preenchido com condições.`
      }
    ]);

    filhos.forEach((filho: RuleNode) => this.validar(filho));
  }

  private validarNoComparacao(valores: any, chave: string): void {
    this.executarValidacoes([
      {
        invalido: !Array.isArray(valores) || valores.length !== 2,
        erro: `Regra corrompida: O operador de comparação '${chave}' exige exatamente 2 elementos.`
      }
    ]);

    const [esquerda, direita] = valores;

    this.executarValidacoes([
      {
        invalido: typeof esquerda !== "string" || !esquerda.startsWith("$"),
        erro: `Brecha de segurança: O operando esquerdo '${esquerda}' no operador '${chave}' precisa ser uma string iniciando obrigatoriamente com '$'.`
      },
      {
        invalido: typeof direita === "string" && !direita.startsWith("$"),
        erro: `Brecha de segurança: O operando direito '${direita}' no operador '${chave}' é uma string, portanto deve iniciar com '$' ou ser um valor numérico direto.`
      }
    ]);
  }

  private executarValidacoes(regras: { invalido: boolean; erro: string }[]): void {
    const falha = regras.find(r => r.invalido);
    if (falha) {
      throw new SemanticRuleException(falha.erro);
    }
  }
}