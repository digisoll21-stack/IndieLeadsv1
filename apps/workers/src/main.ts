
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerPool');
  const app = await NestFactory.createApplicationContext(WorkerModule);

  logger.log('IndieLeads Worker Pool initialized. Consuming queues...');
}

bootstrap();
