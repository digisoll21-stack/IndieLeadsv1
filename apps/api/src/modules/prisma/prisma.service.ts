
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../../common/context/tenant-context.service';

/**
 * World-class Persistence Layer
 * Provides a type-safe, multi-tenant aware Prisma client with automated isolation.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly _rawClient: PrismaClient;
  public readonly client: ReturnType<typeof this.createExtendedClient>;

  constructor(private readonly tenantContext: TenantContextService) {
    this._rawClient = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    this.client = this.createExtendedClient();
  }

  /**
   * Creates an extended Prisma client that automatically injects workspaceId
   * into every query to enforce multi-tenant isolation.
   */
  private createExtendedClient() {
    const tenantContext = this.tenantContext;
    const rawClient = this._rawClient;

    return this._rawClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const workspaceId = tenantContext.getWorkspaceId();

            // Models that require horizontal multi-tenant isolation
            const modelsWithWorkspace = [
              'Inbox', 'Domain', 'Lead', 'Campaign', 'SendingLog',
              'ReplyLog', 'Member', 'WarmupAccount', 'SequenceStep',
              'AuditLog', 'Notification', 'DeliverabilityTest', 'BounceLog', 'TrackingLog'
            ];

            // Models that are global or isolated by other means (e.g., User by ID)
            const bypassModels = ['User', 'Workspace'];

            if (bypassModels.includes(model) || !modelsWithWorkspace.includes(model as any) || !workspaceId) {
              return query(args);
            }

            // 1. Convert findUnique into findFirst (which allows non-unique filters)
            if (operation === 'findUnique') {
              const anyArgs = args as any || {};
              return (rawClient as any)[model].findFirst({
                ...anyArgs,
                where: { ...anyArgs.where, workspaceId }
              });
            }

            // 2. Pre-verify ownership for update and delete before executing on the database
            if (operation === 'update' || operation === 'delete') {
              const anyArgs = args as any || {};
              const record = await (rawClient as any)[model].findFirst({
                where: { id: anyArgs.where.id, workspaceId },
                select: { id: true }
              });
              if (!record) {
                throw new Error(`Record not found in the current workspace isolation context.`);
              }
              // Proceed with query since ownership has been verified
              return query(args);
            }

            // 3. Read & Write list operations isolation
            if (['findFirst', 'findMany', 'count', 'updateMany', 'deleteMany'].includes(operation)) {
              const anyArgs = args as any || {};
              anyArgs.where = { ...anyArgs.where, workspaceId };
            }

            // Special Case: Upsert
            if (operation === 'upsert') {
              const anyArgs = args as any || {};
              anyArgs.create = { ...anyArgs.create, workspaceId };
              anyArgs.update = { ...anyArgs.update, workspaceId };
              anyArgs.where = { ...anyArgs.where, workspaceId };
            }

            // Special Case: Create
            if (['create', 'createMany'].includes(operation)) {
              const anyArgs = args as any || {};
              if (Array.isArray(anyArgs.data)) {
                anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, workspaceId }));
              } else {
                anyArgs.data = { ...anyArgs.data, workspaceId };
              }
            }

            return query(args);
          },
        },
      },
    });
  }

  // Model-specific Accessors (Delegated to extended client)
  get user() { return this.client.user; }
  get workspace() { return this.client.workspace; }
  get member() { return this.client.member; }
  get lead() { return this.client.lead; }
  get inbox() { return this.client.inbox; }
  get campaign() { return this.client.campaign; }
  get domain() { return this.client.domain; }
  get warmupAccount() { return this.client.warmupAccount; }
  get sendingLog() { return this.client.sendingLog; }
  get replyLog() { return this.client.replyLog; }
  get bounceLog() { return this.client.bounceLog; }
  get sequenceStep() { return this.client.sequenceStep; }
  get auditLog() { return this.client.auditLog; }
  get notification() { return this.client.notification; }
  get deliverabilityTest() { return this.client.deliverabilityTest; }
  get trackingLog() { return this.client.trackingLog; }

  // Use raw client for raw queries to avoid extension binding bugs
  get $queryRaw() { return this._rawClient.$queryRaw.bind(this._rawClient); }

  /**
   * Lifecycle hook for database connection with exponential backoff retry.
   */
  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this._rawClient.$connect();
        this.logger.log('Persistence Layer: Connection Established');
        break;
      } catch (err) {
        retries--;
        const isPoolerError = err.message.includes('MaxClientsInSessionMode');
        const advice = isPoolerError ? ' TIP: Use session pooling (?connection_limit=2) for high-scale environments.' : '';
        this.logger.error(`Connection Failed: ${err.message}.${advice} Retrying (${retries} left)...`);
        if (retries === 0) throw new Error('Persistence Layer Critical: Database Unreachable');
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }

  /**
   * Lifecycle hook for graceful shutdown.
   */
  async onModuleDestroy() {
    await this._rawClient.$disconnect();
    this.logger.log('Persistence Layer: Disconnected');
  }

  /**
   * Transactional wrapper for the extended client.
   */
  async $transaction(fn: (tx: any) => Promise<any>) {
    return this.client.$transaction(fn);
  }
}
