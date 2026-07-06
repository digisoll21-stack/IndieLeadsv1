
import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin/queues')
@UseGuards(JwtAuthGuard)
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get('health')
  async getHealth() {
    return this.queuesService.getQueueStatus();
  }
}
