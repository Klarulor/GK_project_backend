import { Injectable } from "@nestjs/common";

type RequestMetric = {
  durationMs: number;
  statusCode: number;
  userId: number | null;
  createdAt: number;
};

@Injectable()
export class MetricsService {
  private requests: RequestMetric[] = [];
  private commandSuccessTotal = 0;
  private commandFailureTotal = 0;

  recordRequest(durationMs: number, statusCode: number, userId: number | null) {
    const createdAt = Date.now();
    this.requests.push({ durationMs, statusCode, userId, createdAt });
    this.requests = this.requests.filter(
      (request) => createdAt - request.createdAt < 60 * 60 * 1000,
    );
  }

  recordDeviceCommand(success: boolean) {
    if (success) this.commandSuccessTotal += 1;
    else this.commandFailureTotal += 1;
  }

  toPrometheus(): string {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const now = Date.now();
    const totalRequests = this.requests.length;
    const latencySum = this.requests.reduce(
      (sum, request) => sum + request.durationMs,
      0,
    );
    const p50 = this.percentile(0.5);
    const p95 = this.percentile(0.95);
    const p99 = this.percentile(0.99);
    const activeSessions = new Set(
      this.requests
        .filter(
          (request) =>
            request.userId !== null && now - request.createdAt < 15 * 60 * 1000,
        )
        .map((request) => request.userId),
    ).size;
    const errors = this.requests.filter(
      (request) => request.statusCode >= 500,
    ).length;

    return [
      "# HELP eecs_http_requests_total HTTP requests in the last hour.",
      "# TYPE eecs_http_requests_total counter",
      `eecs_http_requests_total ${totalRequests}`,
      "# HELP eecs_http_request_duration_ms_sum Total HTTP request latency in the last hour.",
      "# TYPE eecs_http_request_duration_ms_sum counter",
      `eecs_http_request_duration_ms_sum ${latencySum}`,
      "# HELP eecs_http_request_duration_ms_avg Average HTTP request latency in the last hour.",
      "# TYPE eecs_http_request_duration_ms_avg gauge",
      `eecs_http_request_duration_ms_avg ${totalRequests ? latencySum / totalRequests : 0}`,
      "# HELP eecs_http_request_duration_ms_quantile HTTP request latency quantiles in the last hour.",
      "# TYPE eecs_http_request_duration_ms_quantile gauge",
      `eecs_http_request_duration_ms_quantile{quantile="0.50"} ${p50}`,
      `eecs_http_request_duration_ms_quantile{quantile="0.95"} ${p95}`,
      `eecs_http_request_duration_ms_quantile{quantile="0.99"} ${p99}`,
      "# HELP eecs_http_errors_total HTTP 5xx responses in the last hour.",
      "# TYPE eecs_http_errors_total counter",
      `eecs_http_errors_total ${errors}`,
      "# HELP eecs_device_commands_total Device commands by result.",
      "# TYPE eecs_device_commands_total counter",
      `eecs_device_commands_total{result="success"} ${this.commandSuccessTotal}`,
      `eecs_device_commands_total{result="failure"} ${this.commandFailureTotal}`,
      "# HELP eecs_active_sessions Active authenticated users seen in the last 15 minutes.",
      "# TYPE eecs_active_sessions gauge",
      `eecs_active_sessions ${activeSessions}`,
      "# HELP eecs_process_resident_memory_bytes Process resident memory.",
      "# TYPE eecs_process_resident_memory_bytes gauge",
      `eecs_process_resident_memory_bytes ${memory.rss}`,
      "# HELP eecs_process_heap_used_bytes Process heap used.",
      "# TYPE eecs_process_heap_used_bytes gauge",
      `eecs_process_heap_used_bytes ${memory.heapUsed}`,
      "# HELP eecs_process_cpu_user_seconds_total Process user CPU time.",
      "# TYPE eecs_process_cpu_user_seconds_total counter",
      `eecs_process_cpu_user_seconds_total ${cpu.user / 1_000_000}`,
      "# HELP eecs_process_cpu_system_seconds_total Process system CPU time.",
      "# TYPE eecs_process_cpu_system_seconds_total counter",
      `eecs_process_cpu_system_seconds_total ${cpu.system / 1_000_000}`,
      "# HELP eecs_app_info Application info.",
      "# TYPE eecs_app_info gauge",
      `eecs_app_info{service="backend"} 1`,
      "# HELP eecs_metrics_timestamp_ms Metrics generation timestamp.",
      "# TYPE eecs_metrics_timestamp_ms gauge",
      `eecs_metrics_timestamp_ms ${now}`,
    ].join("\n");
  }

  private percentile(percentile: number) {
    if (!this.requests.length) return 0;
    const sorted = this.requests
      .map((request) => request.durationMs)
      .sort((left, right) => left - right);
    const index = Math.ceil(percentile * sorted.length) - 1;
    return sorted[Math.max(index, 0)];
  }
}
