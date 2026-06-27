import { RuleNode } from '../types/rule-ast.types';

export interface IRuleRepository {
  
  findByTenantId(tenantId: string): Promise<RuleNode | null>;
}