
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MxService } from './mx.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [LeadsController],
  providers: [LeadsService, MxService],
  exports: [LeadsService, MxService],
})
export class LeadsModule {}
