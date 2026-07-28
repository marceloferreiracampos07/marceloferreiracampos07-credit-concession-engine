import { RuleNode } from "../types/rule-ast.types.js";

export interface ISemanticValidator {
  validar(no: RuleNode): void;
}
