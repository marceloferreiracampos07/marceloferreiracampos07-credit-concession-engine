import { RuleNode } from '../types/rule-ast.types.js';

export interface IRuleRepository {
  
  findByTenantId(tenantId: string): Promise<RuleNode | null>;
}