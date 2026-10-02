import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarriersModule } from '../carriers/carriers.module';
import { Lob, Policy, PolicySchema } from '../database/schemas';
import { LobsModule } from '../lobs/lobs.module';
import { UsersModule } from '../users/users.module';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Policy.name, schema: PolicySchema }]),
    UsersModule,
    LobsModule,
    CarriersModule,
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [MongooseModule, PoliciesService],
})
export class PoliciesModule {}
