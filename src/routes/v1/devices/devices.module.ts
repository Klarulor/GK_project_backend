import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm/dist/typeorm.module";
import { HttpModule } from "@nestjs/axios";
import { DeviceCommandEntity } from "src/database/entities/DeviceCommandEntity";
import { DeviceEntity } from "src/database/entities/DeviceEntity";
import { UserEntity } from "src/database/entities/UserEntity";
import { SecurityModule } from "src/modules/security/security.module";
import { UsersModule } from "../users/users.module";
import { DevicesController } from "./devices.controller";
import { DevicesService } from "./devices.service";
import { NotificationsModule } from "src/modules/notifications/notifications.module";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([DeviceEntity, DeviceCommandEntity, UserEntity]),
    SecurityModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
