# 📑 Planejamento: Caso de Uso 1 (Motor de Regras / AST)

## 1. Fluxo de Execução (Fail-Fast)
O Caso de Uso cruza os dados do Usuário (Payload) com a Regra do Banco (AST).

* **Passo 1:** API recebe o Payload do usuário e valida na borda com Zod.
* **Passo 2:** Sistema busca a Regra (JSON/AST) no banco usando o `tenantId`.
* **Passo 3:** Rodam as Camadas de Proteção Semântica e Execução (Se falhar, encerra imediatamente).
* **Passo 4:** Retorna o veredito final (`APPROVED` ou `REJECTED`) com a justificativa em caso de rejeição.

---

## 2. Modelagem dos Dados

### A. Payload de Entrada (Usuário)
* `tenantId`: ID do parceiro (Dono da regra).
* `loanAmount`: Valor do empréstimo solicitado (Ex: 5000).
* `client.score`: Score de crédito do cliente (Ex: 700).
* `client.income`: Renda mensal do cliente (Ex: 4000).

### B. Estrutura da Regra (Banco - AST Dinâmica)
A estrutura no banco utiliza os operadores como chaves dinâmicas mapeando para arrays de condições (Nós Lógicos) ou pares de comparação (Nós de Comparação).

* **Nó Pai (Lógico):** `AND` (Exige que todas as sub-regras sejam verdadeiras).
* **Filho Esquerdo (Comparação):** `>` (Valida se `"$client.score" > 600`).
* **Filho Direito (Comparação):** `<` (Valida se `"$loanAmount" < "$client.income"`).

```json
{
  "AND": [
    { ">": ["$client.score", 600] },
    { "<": ["$loanAmount", "$client.income"] }
  ]
}
3. As 3 Camadas de Proteção
🛑 Camada 1: Proteção de Borda (Validação Sintética)
Aplicar .trim() em strings (tenantId) para remover espaços em branco.

Barrar se tenantId, loanAmount ou client vierem nulos ou ausentes via Zod.

Barrar valores impossíveis em runtime: loanAmount <= 0, client.income <= 0 ou client.score < 0.

⚙️ Camada 2: Proteção de Negócio (Validação Semântica)
Validação de Operadores: Varrer recursivamente a árvore e barrar se houver chaves fora da lista branca (AND, OR, >, <, =, !=).

Ancoragem de Variáveis: Validar se todo caminho dinâmico que referencia o payload começa obrigatoriamente com o caractere de escape $. Caso contrário, rejeitar para evitar brechas de injeção de código.

Estrutura de Nós: Garantir que nós de comparação contenham exatamente 2 elementos no array associado.

🧠 Camada 3: Núcleo de Execução (Core Execution)
Resolução de Caminhos (Deep Get): Função utilitária null-safe para limpar o $ e navegar de forma segura em objetos aninhados (ex: "$client.income" vira o valor numérico 4000). Se o campo não existir no payload, a execução falha graciosamente retornando REJECTED.

Curto-Circuito (Short-circuit Evaluation):

Se um nó AND encontrar qualquer resultado False, interrompe a avaliação e rejeita.

Se um nó OR encontrar qualquer resultado True, interrompe a avaliação e aprova o nó.

Resolução Recursiva:

Lado Esquerdo: 700 > 600 -> True

Lado Direito: 5000 < 4000 -> False

Resultado do AND [True, False] -> OUTPUT: REJECTED

4. Regras do Motor
Suporte Completo: A regra deve suportar obrigatoriamente operadores lógicos (AND, OR) e de comparação (>, <, =, !=).

Comportamento Agnóstico: O motor deve ser totalmente isolado matematicamente; ele apenas cruza o input com a regra e retorna true ou false puros. O Caso de Uso se encarrega de transformar esse booleano em APPROVED ou REJECTED.

5. Acceptance Criteria (DoD)
Zero Hardcode: O código não deve conter estruturas estáticas como if (score > X). Toda a lógica deve ser interpretada dinamicamente a partir do JSON da AST.

Isolamento de Erros: Exceções causadas por regras malformadas ou corrompidas no banco de dados devem ser capturadas pelo try/catch principal do UseCase, retornando um payload limpo de REJECTED com a razão do erro, sem estourar erro 500 ou derrubar o servidor Node.js.

Imutabilidade: O motor realiza uma operação puramente de leitura (Read-Only) sobre o payload do cliente.

6. Test Cases (Cenários de Teste)
Cenário 1 (Sucesso): Aprovação de crédito usando regras com nós aninhados (AND contendo sub-nós OR).

Cenário 2 (Negócios): Rejeição de crédito legítima baseada nos critérios da árvore.

Cenário 3 (Payload Incompleto): Envio de payload sem propriedades exigidas pela AST (deve retornar REJECTED com mensagem amigável sem quebrar).

Cenário 4 (Regra Corrompida): Regra cadastrada com operador inválido (ex: {"XOR": [...]}) ou caminho sem $ (deve ser barrado na Camada 2).

Cenário 5 (Curto-Circuito): Garantir que o motor para de avaliar as outras pernas de um AND assim que a primeira falhar.