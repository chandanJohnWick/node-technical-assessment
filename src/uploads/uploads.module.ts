import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AgentsModule } from '../agents/agents.module';
import { CarriersModule } from '../carriers/carriers.module';
import { LobsModule } from '../lobs/lobs.module';
import { PoliciesModule } from '../policies/policies.module';
import { UsersModule } from '../users/users.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [AgentsModule, AccountsModule, UsersModule, LobsModule, CarriersModule, PoliciesModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
