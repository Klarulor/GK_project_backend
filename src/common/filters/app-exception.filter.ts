import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? JSON.stringify(exception.message) : "Unexpected error";

    this.logException(exception, request, status, message);

    response.status(status).json({
      statusCode: status,
      message: status === 500 ? "Internal server error" : message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private logException(
    exception: unknown,
    request: Request,
    status: number,
    message: string,
  ) {
    const payload = {
      event: this.resolveEvent(exception, status),
      method: request.method,
      path: request.url,
      statusCode: status,
      message,
    };

    if (exception instanceof QueryFailedError) {
      this.logger.error({
        ...payload,
        event: "DB_CONNECTION_OR_QUERY_FAILED",
      });
      return;
    }

    if (exception instanceof UnauthorizedException || status === 401) {
      this.logger.error({
        ...payload,
        event: "AUTH_ERROR",
      });
      return;
    }

    if (status >= 500) {
      this.logger.error(payload);
      return;
    }

    if (status >= 400) {
      this.logger.warn(payload);
    }
  }

  private resolveEvent(exception: unknown, status: number) {
    if (exception instanceof QueryFailedError)
      return "DB_CONNECTION_OR_QUERY_FAILED";
    if (status === 401) return "AUTH_ERROR";
    if (status >= 500) return "API_ERROR";
    return "API_REQUEST_REJECTED";
  }
}
