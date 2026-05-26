import { Controller, Get } from "@nestjs/common";
import { StartupHealthIndicator } from "../../modules/health/startup.health.indicator";
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from "@nestjs/terminus";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { HEALTH_CHECK_SCHEMA } from "./schemas";

@Controller("")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private startupIndicator: StartupHealthIndicator,
  ) {}

  @ApiOperation({ summary: "Check health" })
  @ApiOkResponse({ schema: HEALTH_CHECK_SCHEMA })
  @Get("health")
  @HealthCheck()
  checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.startupIndicator.isHealthy("startup"),
    ]);
  }
}
