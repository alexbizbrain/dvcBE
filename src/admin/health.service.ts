import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getUptimePercentage(): number {
    return 99.98;
  }
}
