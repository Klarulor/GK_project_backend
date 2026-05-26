import { Module } from "@nestjs/common";
import { HealthModule } from "../../modules/health/health.module";
import { HealthController } from "./health.controller";
import { TerminusModule } from "@nestjs/terminus";
import { MetricsController } from "./metrics.controller";

@Module({
  imports: [HealthModule, TerminusModule],
  controllers: [HealthController, MetricsController],
})
export class RootModule {}
