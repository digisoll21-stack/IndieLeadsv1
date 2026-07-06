
import { Module, Global } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [WorkspacesModule, PrismaModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule { }
