import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
    imports: [PrismaModule, QueuesModule],
    controllers: [AdminController],
})
export class AdminModule { }
