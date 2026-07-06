
import { Module, Global } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';

@Global()
@Module({
  providers: [QueuesService],
  controllers: [QueuesController],
  exports: [QueuesService],
})
export class QueuesModule {}
