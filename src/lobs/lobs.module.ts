import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lob, LobSchema } from '../database/schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: Lob.name, schema: LobSchema }])],
  exports: [MongooseModule],
})
export class LobsModule {}
