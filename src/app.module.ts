import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { RestModule } from "./routes/rest.module";
import { ConfigModule } from "@nestjs/config";
import configuration from "./config/configuration";
import { envValidationSchema } from "./config/env.validation";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "./database/typeorm-pg.config";
import { ReadinessService } from "./modules/health/readiness.service";
import { TerminusModule } from "@nestjs/terminus";
import { HealthModule } from "./modules/health/health.module";
import { ScheduleModule } from "@nestjs/schedule";
import { ElectricityModule } from "./modules/electricity/electricity.module";
import { SecurityModule } from "./modules/security/security.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { AppExceptionFilter } from "./common/filters/app-exception.filter";

@Module({
  imports: [
    RestModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      envFilePath: `.env.${process.env.NODE_ENV || "development"}`,
      cache: true,
      expandVariables: true,
    }),

    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TerminusModule,
    HealthModule,
    ElectricityModule,
    SecurityModule,
    NotificationsModule,
    MetricsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {
  constructor(private readonly readinessService: ReadinessService) {}

  onApplicationBootstrap() {
    this.readinessService.markAsReady();
    console.log(
      JSON.stringify({
        level: "info",
        event: "APPLICATION_READY",
        message: "Application Lifecycle: Readiness State -> ACTIVE",
      }),
    );
  }
}
