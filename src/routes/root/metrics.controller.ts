import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { MetricsService } from "src/modules/metrics/metrics.service";

@Controller("")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: "Prometheus-compatible application metrics" })
  @Get("metrics")
  @Header("Content-Type", "text/plain; version=0.0.4")
  metrics(): string {
    return this.metricsService.toPrometheus();
  }
}
