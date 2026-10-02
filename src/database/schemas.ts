import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ collection: 'agents', timestamps: true })
export class Agent {
  @Prop({ required: true, index: true })
  agentName!: string;
}
export type AgentDocument = HydratedDocument<Agent>;
export const AgentSchema = SchemaFactory.createForClass(Agent);

@Schema({ collection: 'accounts', timestamps: true })
export class Account {
  @Prop({ required: true, index: true })
  accountName!: string;
}
export type AccountDocument = HydratedDocument<Account>;
export const AccountSchema = SchemaFactory.createForClass(Account);

@Schema({ collection: 'lobs', timestamps: true })
export class Lob {
  @Prop({ required: true, index: true })
  categoryName!: string;
}
export type LobDocument = HydratedDocument<Lob>;
export const LobSchema = SchemaFactory.createForClass(Lob);

@Schema({ collection: 'carriers', timestamps: true })
export class Carrier {
  @Prop({ required: true, index: true })
  companyName!: string;
}
export type CarrierDocument = HydratedDocument<Carrier>;
export const CarrierSchema = SchemaFactory.createForClass(Carrier);

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, index: true })
  firstName!: string;

  @Prop()
  dob?: Date;

  @Prop()
  address?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  state?: string;

  @Prop()
  zipCode?: string;

  @Prop({ index: true, sparse: true })
  email?: string;

  @Prop()
  gender?: string;

  @Prop()
  userType?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Agent' })
  agentId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  accountId?: Types.ObjectId;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ collection: 'policies', timestamps: true })
export class Policy {
  @Prop({ required: true, unique: true, index: true })
  policyNumber!: string;

  @Prop()
  policyStartDate?: Date;

  @Prop()
  policyEndDate?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Lob' })
  policyCategoryId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Carrier' })
  companyId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;
}
export type PolicyDocument = HydratedDocument<Policy>;
export const PolicySchema = SchemaFactory.createForClass(Policy);

@Schema({ collection: 'scheduledmessages', timestamps: true })
export class ScheduledMessage {
  @Prop({ required: true })
  message!: string;

  @Prop({ required: true, index: true })
  scheduledAt!: Date;

  @Prop()
  deliveredAt?: Date;
}
export type ScheduledMessageDocument = HydratedDocument<ScheduledMessage>;
export const ScheduledMessageSchema = SchemaFactory.createForClass(ScheduledMessage);
