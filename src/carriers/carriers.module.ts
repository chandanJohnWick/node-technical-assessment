import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Carrier, CarrierSchema } from '../database/schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: Carrier.name, schema: CarrierSchema }])],
  exports: [MongooseModule],
})
export class CarriersModule {}
