import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as os from 'node:os';
import { performance } from 'node:perf_hooks';

@Injectable()
export class CpuMonitorService implements OnModuleInit, OnModuleDestroy {
  private previousCpuUsage = process.cpuUsage();
  private previousSampleAt = performance.now();
  private timer?: NodeJS.Timeout;

  onModuleInit(): void {
    const interval = Number(process.env.CPU_CHECK_INTERVAL_MS || 5000);
    const threshold = Number(process.env.CPU_LIMIT_PERCENT || 70);
    this.timer = setInterval(() => this.checkCpu(threshold), interval);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private checkCpu(threshold: number): void {
    const now = performance.now();
    const elapsedMicroseconds = (now - this.previousSampleAt) * 1000;
    const currentCpuUsage = process.cpuUsage();
    const usedMicroseconds =
      currentCpuUsage.user - this.previousCpuUsage.user +
      currentCpuUsage.system - this.previousCpuUsage.system;

    this.previousCpuUsage = currentCpuUsage;
    this.previousSampleAt = now;

    const cpuCount = Math.max(1, os.availableParallelism());
    const usage = elapsedMicroseconds > 0
      ? (usedMicroseconds / (elapsedMicroseconds * cpuCount)) * 100
      : 0;
    if (usage >= threshold) {
      console.error(
        'Node process CPU at ' + usage.toFixed(1) + '% exceeds ' + threshold +
          '%. Exiting for supervisor restart.',
      );
      process.exit(1);
    }
  }
}
