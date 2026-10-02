import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ScheduleMessageDto } from './schedule-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  schedule(@Body() body: ScheduleMessageDto) {
    const scheduledAt = new Date(body.day + 'T' + body.time + ':00');
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('The requested date and time are invalid.');
    }
    return this.messagesService.create(body.message.trim(), scheduledAt);
  }
}
