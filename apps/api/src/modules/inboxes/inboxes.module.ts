
import { Module } from '@nestjs/common';
import { InboxesService } from './inboxes.service';
import { InboxesController } from './inboxes.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { GmailAdapter } from './adapters/gmail.adapter';
import { OutlookAdapter } from './adapters/outlook.adapter';
import { SmtpAdapter } from './adapters/smtp.adapter';

import { SecurityModule } from '../security/security.module';

@Module({
  imports: [WorkspacesModule, SecurityModule],
  controllers: [InboxesController],
  providers: [
    InboxesService,
    GmailAdapter,
    OutlookAdapter,
    SmtpAdapter,
  ],
  exports: [InboxesService, SmtpAdapter],
})
export class InboxesModule { }
