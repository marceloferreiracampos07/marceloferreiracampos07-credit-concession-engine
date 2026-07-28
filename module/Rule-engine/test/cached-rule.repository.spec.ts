import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedRuleRepository } from '../repositories/cached-rule.repository.js';
import { IRuleRepository } from '../repositories/irule.repository.js';
import { ICacheRepository } from '../repositories/ICacheRepository.js';

describe('CachedRuleRepository', () => {
  let cachedRepo: CachedRuleRepository;
  let mockPrimaryRepo: import('vitest').Mocked<IRuleRepository>;
  let mockCacheRepo: import('vitest').Mocked<ICacheRepository>;

  beforeEach(() => {
    mockPrimaryRepo = {
      findByTenantId: vi.fn(),
    };
    mockCacheRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    cachedRepo = new CachedRuleRepository(mockPrimaryRepo, mockCacheRepo);
  });

  const mockAst = { '>': ['$score', 600] } as any;

  it('deve retornar do cache (Cache Hit) e nao chamar o banco', async () => {
    mockCacheRepo.get.mockResolvedValue(mockAst);

    const result = await cachedRepo.findByTenantId('tenant-1');

    expect(result).toBe(mockAst);
    expect(mockCacheRepo.get).toHaveBeenCalledWith('regras:tenant:tenant-1');
    expect(mockPrimaryRepo.findByTenantId).not.toHaveBeenCalled();
  });

  it('deve buscar no banco (Cache Miss) e salvar no cache', async () => {
    mockCacheRepo.get.mockResolvedValue(null);
    mockPrimaryRepo.findByTenantId.mockResolvedValue(mockAst);

    const result = await cachedRepo.findByTenantId('tenant-2');

    expect(result).toBe(mockAst);
    expect(mockCacheRepo.get).toHaveBeenCalledWith('regras:tenant:tenant-2');
    expect(mockPrimaryRepo.findByTenantId).toHaveBeenCalledWith('tenant-2');
    expect(mockCacheRepo.set).toHaveBeenCalledWith('regras:tenant:tenant-2', mockAst, 86400);
  });

  it('deve retornar null se nao achar nem no cache e nem no banco', async () => {
    mockCacheRepo.get.mockResolvedValue(null);
    mockPrimaryRepo.findByTenantId.mockResolvedValue(null);

    const result = await cachedRepo.findByTenantId('tenant-3');

    expect(result).toBeNull();
    expect(mockCacheRepo.set).not.toHaveBeenCalled();
  });

  it('deve lidar graciosamente com falha de leitura no cache e buscar no banco', async () => {
    mockCacheRepo.get.mockRejectedValue(new Error('Redis is down'));
    mockPrimaryRepo.findByTenantId.mockResolvedValue(mockAst);
    
    // Silencia o console.error temporariamente para limpar o log do teste
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await cachedRepo.findByTenantId('tenant-fail');

    expect(result).toBe(mockAst);
    expect(mockPrimaryRepo.findByTenantId).toHaveBeenCalledWith('tenant-fail');
    
    consoleSpy.mockRestore();
  });

  it('deve lidar graciosamente com falha de escrita no cache ao salvar', async () => {
    mockCacheRepo.get.mockResolvedValue(null);
    mockPrimaryRepo.findByTenantId.mockResolvedValue(mockAst);
    mockCacheRepo.set.mockRejectedValue(new Error('Falha ao salvar no redis'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await cachedRepo.findByTenantId('tenant-write-fail');

    expect(result).toBe(mockAst);
    expect(mockPrimaryRepo.findByTenantId).toHaveBeenCalledWith('tenant-write-fail');
    expect(mockCacheRepo.set).toHaveBeenCalledWith('regras:tenant:tenant-write-fail', mockAst, 86400);

    consoleSpy.mockRestore();
  });
});
