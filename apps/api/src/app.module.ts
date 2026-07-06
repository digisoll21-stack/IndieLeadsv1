
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from './config/config.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { InboxesModule } from './modules/inboxes/inboxes.module';
import { DomainsModule } from './modules/domains/domains.module';
import { QueuesModule } from './modules/queues/queues.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { BouncesModule } from './modules/bounces/bounces.module';
import { RepliesModule } from './modules/replies/replies.module';
import { WarmupModule } from './modules/warmup/warmup.module';
import { DeliverabilityLabModule } from './modules/deliverability/deliverability-lab.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SecurityModule } from './modules/security/security.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TenantContextService } from './common/context/tenant-context.service';
import { HealthController } from './modules/health/health.controller';
import { AppController } from './app.controller';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    SecurityModule,
    AdminModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    InboxesModule,
    AnalyticsModule,
    DomainsModule,
    QueuesModule,
    LeadsModule,
    CampaignsModule,
    TrackingModule,
    BouncesModule,
    RepliesModule,
    WarmupModule,
    DeliverabilityLabModule,
    NotificationsModule,
    AuditLogsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'apps/web/dist'),
      exclude: ['/api/(.*)'],
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware, RequestIdMiddleware)
      .forRoutes('*');
  }
}
