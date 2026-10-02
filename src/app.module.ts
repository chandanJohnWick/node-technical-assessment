import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from './accounts/accounts.module';
import { AgentsModule } from './agents/agents.module';
import { AppController } from './app.controller';
import { CarriersModule } from './carriers/carriers.module';
import { CpuMonitorModule } from './cpu/cpu-monitor.module';
import { LobsModule } from './lobs/lobs.module';
import { MessagesModule } from './messages/messages.module';
import { PoliciesModule } from './policies/policies.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://127.0.0.1:27017/policy_assessment'),
      }),
    }),
    AgentsModule,
    AccountsModule,
    UsersModule,
    LobsModule,
    CarriersModule,
    PoliciesModule,
    UploadsModule,
    MessagesModule,
    CpuMonitorModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
