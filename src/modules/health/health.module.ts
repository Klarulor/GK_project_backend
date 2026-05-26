import { Module } from "@nestjs/common";
import { ReadinessService } from "./readiness.service";
import { StartupHealthIndicator } from "./startup.health.indicator";
import { TerminusModule } from "@nestjs/terminus";

@Module({
  imports: [TerminusModule],
  providers: [ReadinessService, StartupHealthIndicator],
  exports: [StartupHealthIndicator, ReadinessService],
})
export class HealthModule {}
