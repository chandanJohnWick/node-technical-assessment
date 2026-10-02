import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as os from 'node:os';

@Injectable()
export class CpuMonitorService implements OnModuleInit, OnModuleDestroy {
  private previous = os.cpus().map((cpu) => ({ ...cpu.times }));
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
    let idle = 0;
    let total = 0;
    os.cpus().forEach((cpu, index) => {
      const previous = this.previous[index];
      const current = cpu.times;
      const idleDelta = current.idle - previous.idle;
      const totalDelta = Object.keys(current).reduce(
        (sum, key) => sum + current[key as keyof typeof current] - previous[key as keyof typeof previous],
        0,
      );
      idle += idleDelta;
      total += totalDelta;
      this.previous[index] = { ...current };
    });

    const usage = total > 0 ? (1 - idle / total) * 100 : 0;
    if (usage >= threshold) {
      console.error(
        'Host CPU at ' + usage.toFixed(1) + '% exceeds ' + threshold + '%. Exiting for supervisor restart.',
      );
      process.exit(1);
    }
  }
}
