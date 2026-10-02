import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduledMessage } from '../database/schemas';

@Injectable()
export class MessagesService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectModel(ScheduledMessage.name)
    private readonly messageModel: Model<ScheduledMessage>,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.markDueMessages(), 1000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  create(message: string, scheduledAt: Date) {
    return this.messageModel.create({ message, scheduledAt });
  }

  private async markDueMessages(): Promise<void> {
    const now = new Date();
    try {
      await this.messageModel.updateMany(
        { scheduledAt: { $lte: now }, deliveredAt: null },
        { $set: { deliveredAt: now } },
      ).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Scheduled-message poll failed:', message);
    }
  }
}
