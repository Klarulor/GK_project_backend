import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/database/entities/UserEntity";
import { SecurityModule } from "src/modules/security/security.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), SecurityModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
