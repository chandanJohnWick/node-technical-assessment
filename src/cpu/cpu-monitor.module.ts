import { Module } from '@nestjs/common';
import { CpuMonitorService } from './cpu-monitor.service';

@Module({ providers: [CpuMonitorService] })
export class CpuMonitorModule {}
