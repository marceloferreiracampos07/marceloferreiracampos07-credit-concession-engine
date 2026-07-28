import { IRuleRepository } from "./irule.repository.js";
import { ICacheRepository } from "./ICacheRepository.js";
import { RuleNode } from "../types/rule-ast.types.js";

export class CachedRuleRepository implements IRuleRepository {
  private readonly UM_DIA_EM_SEGUNDOS = 86400;

  constructor(
    private readonly primaryRepository: IRuleRepository,
    private readonly cacheRepository: ICacheRepository
  ) {}

  async findByTenantId(tenantId: string): Promise<RuleNode | null> {
    const cacheKey = `regras:tenant:${tenantId}`;

    // 1. Tenta buscar no Cache (Leitura rápida)
    try {
      const cacheHit = await this.cacheRepository.get<RuleNode>(cacheKey);
      if (cacheHit) {
        return cacheHit;
      }
    } catch (erroCache) {
      console.error(`[Cache Error] Falha de leitura na camada de cache para o tenant ${tenantId}:`, erroCache);
      // Fallback silencioso: se o cache falhar, continua para o banco de dados
    }

    // 2. Se não estiver no cache, busca no banco de dados (Repositório Primário)
    const astRegra = await this.primaryRepository.findByTenantId(tenantId);

    // 3. Se achou no banco, salva no cache para as próximas chamadas
    if (astRegra) {
      try {
        await this.cacheRepository.set(cacheKey, astRegra, this.UM_DIA_EM_SEGUNDOS);
      } catch (erroCache) {
        console.error(`Falha de escrita na camada de cache para o tenant ${tenantId}:`, erroCache);
        // Fallback silencioso: se não conseguir salvar no cache, a regra continua sendo devolvida normalmente
      }
    }

    return astRegra;
  }
}
