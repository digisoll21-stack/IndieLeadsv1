
import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TransactionalEmailService } from './transactional-email.service';
import { NotificationsController } from './notifications.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Global()
@Module({
  imports: [WorkspacesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, TransactionalEmailService],
  exports: [NotificationsService, TransactionalEmailService],
})
export class NotificationsModule { }
