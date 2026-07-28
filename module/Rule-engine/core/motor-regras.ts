import { RuleNode } from "../types/rule-ast.types.js";
import { IMotorRegras } from "./imotor-regras.js";
import { RuleExecutionException, MissingDataException } from "../exceptions/domain.exceptions.js";

export class MotorRegras implements IMotorRegras {
  public avaliar(no: RuleNode, payload: any): boolean {
    const operador = Object.keys(no)[0] as keyof RuleNode;

    if (operador === "AND" || operador === "OR") {
      return this.executarLogica(operador, no[operador]!, payload);
    }

    return this.executarComparacao(operador, no[operador]!, payload);
  }

  private executarLogica(operador: "AND" | "OR", filhos: RuleNode[], payload: any): boolean {
    const estrategiasLogicas = {
      AND: () => filhos.every(filho => this.avaliar(filho, payload)),
      OR:  () => filhos.some(filho => this.avaliar(filho, payload))
    };

    return estrategiasLogicas[operador]();
  }

  private executarComparacao(operador: string, corpo: any[], payload: any): boolean {
    const [esquerda, direita] = corpo;

    const valorEsquerda = this.obterValorPorCaminho(payload, esquerda);
    const valorDireita = typeof direita === "string" ? this.obterValorPorCaminho(payload, direita) : direita;

    const estrategiasComparacao: Record<string, () => boolean> = {
      ">":  () => valorEsquerda > valorDireita,
      "<":  () => valorEsquerda < valorDireita,
      "=":  () => valorEsquerda === valorDireita,
      "!=": () => valorEsquerda !== valorDireita,
    };

    const operacao = estrategiasComparacao[operador];

    if (!operacao) {
      throw new RuleExecutionException(`Regra corrompida: O operador de comparação '${operador}' não possui uma implementação válida.`);
    }

    return operacao();
  }

  private obterValorPorCaminho(payload: any, caminho: string): any {
    const caminhoLimpo = caminho.slice(1);
    const chaves = caminhoLimpo.split(".");

    const resultado = chaves.reduce((objetoAtual, chaveAtual) => {
      return objetoAtual?.[chaveAtual];
    }, payload);

    if (resultado === undefined) {
      throw new MissingDataException(`Dados insuficientes: Atributo '${caminhoLimpo}' requerido pela regra não foi fornecido.`);
    }

    return resultado;
  }
}