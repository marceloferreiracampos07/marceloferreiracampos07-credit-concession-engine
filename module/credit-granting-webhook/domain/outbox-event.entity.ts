export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export type TenantFormat = 'JSON' | 'XML';

export class OutboxEventEntity {
  constructor(
    public readonly id: string,
    public readonly aggregateType: string,
    public readonly eventType: string,
    public readonly tenantUrl: string,
    public readonly tenantFormat: TenantFormat,
    public readonly payload: Record<string, any>,
    public status: OutboxStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public markAsProcessed(currentTime: Date = new Date()): void {
    this.status = 'PROCESSED';
    this.updatedAt = currentTime;
  }
}
