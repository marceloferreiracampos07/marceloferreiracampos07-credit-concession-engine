export type ComparisonOperator = '>' | '<' | '=' | '!=';
export type LogicalOperator = 'AND' | 'OR';
export type Operator = ComparisonOperator | LogicalOperator;

// Representa um nó de comparação. Ex: { ">": ["$client.score", 600] } && { "<": ["$loanAmount", "$client.income"] }
export type ComparisonNode = {
  [key in ComparisonOperator]?: [string, string | number];
};

// Representa um nó lógico que agrupa uma lista de outras regras. Ex: { "AND": [ ... ] }
export type LogicalNode = {
  [key in LogicalOperator]?: RuleNode[];
};

// O nó da árvore pode ser ou de comparação ou lógico
export type RuleNode = ComparisonNode & LogicalNode;