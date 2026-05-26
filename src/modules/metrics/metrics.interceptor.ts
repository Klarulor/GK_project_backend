import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError, tap } from "rxjs";
import { Request, Response } from "express";
import { UserEntity } from "src/database/entities/UserEntity";
import { MetricsService } from "./metrics.service";

type RequestWithUser = Request & {
  user?: UserEntity;
};

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  private readonly logger = new Logger(MetricsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        this.record(startedAt, response.statusCode, request.user?.id ?? null);
        this.logger.log({
          event: "API_REQUEST",
          method: request.method,
          path: request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
          userId: request.user?.id ?? null,
        });
      }),
      catchError((error) => {
        this.record(
          startedAt,
          response.statusCode >= 400 ? response.statusCode : 500,
          request.user?.id ?? null,
        );
        throw error;
      }),
    );
  }

  private record(startedAt: number, statusCode: number, userId: number | null) {
    this.metricsService.recordRequest(
      Date.now() - startedAt,
      statusCode,
      userId,
    );
  }
}
