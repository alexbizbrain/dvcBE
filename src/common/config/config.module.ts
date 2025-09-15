import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import { validationSchema } from './validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
      expandVariables: true,
    }),
  ],
})
export class AppConfigModule {}
