Planejamento: Caso de Uso 2 (Gestão de Fundo de Crédito)
1. Fluxo de Execução (Conciliado com o Motor de Crédito)
O Caso de Uso 2 atua como o executor financeiro, sendo acionado apenas se o Motor de Regras (Caso de Uso 1) retornar APPROVED.

Passo 1: Recebimento do veredito de aprovação do motor de crédito. = feito 

Passo 2: Abertura de Transação (BEGIN) para garantir atomicidade.

Passo 3: Aplicação de Pessimistic Lock (FOR UPDATE) no registro do fundo do tenant.

Passo 4: Validação de saldo disponível (Saldo >= Valor Solicitado).= feito 

Passo 5: Execução das operações de escrita (Débito no saldo e Registro do contrato) = feito 

Passo 6: Finalização da transação (COMMIT) e liberação do Lock.

2. Modelagem dos Dados e Integridade
A. Tabela de Fundos (Estado Atual)
id: UUID (PK).

tenantId: String (Unique Index - fundamental para o lock granular).

balance: Decimal/Integer (Saldo disponível em centavos para evitar erros de ponto flutuante).

updatedAt: Timestamp.

B. Tabela de Contratos (Histórico de Saída)
id: UUID (PK).

tenantId: String (FK).

amount: Decimal/Integer.

status: Enum (APPROVED, REJECTED).

createdAt: Timestamp.

3. Estratégia de Concorrência: Pessimistic Locking
Para assegurar a integridade financeira e evitar condições de corrida (race conditions), adotaremos o bloqueio pessimista via banco de dados.

Por que Pessimistic Lock? Em um ambiente financeiro, a consistência é prioritária. O bloqueio SELECT ... FOR UPDATE serializa as requisições na fila de escrita do banco, garantindo que o saldo seja lido e validado com exclusividade pela transação que obteve o lock primeiro.

Evitando Deadlocks: Garantir que o acesso seja feito sempre na mesma ordem (Lock no Fundo -> Insert no Contrato).

Performance: O uso de Unique Index no tenantId evita que o banco trave a tabela inteira, aplicando o lock estritamente na linha do fundo do cliente específico.

4. Camadas de Segurança e ACID
Atomicidade: O uso de transação BEGIN...COMMIT garante que, caso a inserção do contrato falhe, o débito do saldo seja automaticamente revertido pelo banco (rollback).

Consistência: A regra Saldo >= 0 será aplicada tanto via lógica de negócio (if) quanto via database constraint (ex: CHECK (balance >= 0)), provendo uma camada dupla de proteção.

5. Critérios de Aceite (DoD)
[ ] Transacionalidade: Garantir que o saldo e o contrato sejam persistidos na mesma transação.

[ ] Tratamento de Erros: Retornar INSUFFICIENT_FUNDS quando o saldo não comportar a operação.

[ ] Performance: Assegurar que o Lock seja mantido pelo menor tempo possível, evitando chamadas de I/O externas dentro da transação.

[ ] Concorrência: Passar no teste de carga com 50+ requisições simultâneas sem inconsistências no saldo.

6. Test Cases (Cenários de Teste)
Cenário 1 (Sucesso): Saldo total de R$ 10.000,00 com uma requisição de R$ 6.000,00 resultando em R$ 4.000,00 de saldo final.

Cenário 2 (Fila e Rejeição): Disparo de duas requisições simultâneas de R$ 6.000,00. A primeira deve ser aprovada, a segunda deve ser rejeitada (INSUFFICIENT_FUNDS).

Cenário 3 (Stress Concorrente): Disparo de 50 requisições simultâneas totalizando valor superior ao fundo. Verificar se o saldo final é >= 0 e se o número de contratos gerados é condizente com a disponibilidade.

Cenário 4 (Atomicidade): Simular falha na gravação do contrato (ex: erro de banco) e verificar se o saldo do fundo não foi alterado.