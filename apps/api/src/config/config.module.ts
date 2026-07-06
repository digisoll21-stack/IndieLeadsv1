
import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate,
      cache: true,
      expandVariables: true,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule { }
