import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { JwtSecurityService } from "./jwt.security.service";
import { JwtUserGuard } from "src/common/guards/jwt-user.guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/database/entities/UserEntity";

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  providers: [
    JwtSecurityService,
    JwtUserGuard,
    {
      provide: APP_GUARD,
      useClass: JwtUserGuard,
    },
  ],
  exports: [JwtSecurityService, JwtUserGuard],
})
export class SecurityModule {}
