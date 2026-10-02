import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ScheduleMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'day must use YYYY-MM-DD format' })
  day!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'time must use HH:mm format' })
  time!: string;
}
