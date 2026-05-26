import { Injectable } from "@nestjs/common";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: "mysql",
      host: this.configService.get<string>("DB_HOST"),
      port: this.configService.get<number>("DB_PORT"),
      username: this.configService.get<string>("DB_USER"),
      password: this.configService.get<string>("DB_PASSWORD"),
      database: this.configService.get<string>("DB_NAME"),
      autoLoadEntities: true,

      // ВНИМАНИЕ: synchronize: true допустимо ТОЛЬКО на локальной разработке.
      // В продакшене это архитектурное самоубийство (потеря данных).
      // Там мы используем миграции.
      synchronize: this.configService.get<string>("NODE_ENV") !== "production",

      logging: false, //this.configService.get<string>("NODE_ENV") === "development",
    };
  }
}
