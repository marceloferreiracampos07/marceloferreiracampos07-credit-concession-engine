import { RuleNode } from "../types/rule-ast.types.js";

export interface IMotorRegras {
  avaliar(no: RuleNode, payload: any): boolean;
}
