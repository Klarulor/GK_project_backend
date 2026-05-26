import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HealthIndicatorResult } from "@nestjs/terminus";
import { ReadinessService } from "./readiness.service";

@Injectable()
export class StartupHealthIndicator {
  constructor(private readonly readinessService: ReadinessService) {}

  isHealthy(key: string): HealthIndicatorResult {
    const isReady = this.readinessService.isReady();

    const status = isReady ? "up" : "down";
    const result: HealthIndicatorResult = {
      [key]: {
        status,
        message: isReady ? "Operational" : "Initialization pending",
      },
    };

    if (isReady) {
      return result;
    }
    //result[key].message = "Error";
    //return result;
    throw new InternalServerErrorException("Error");
  }
}
