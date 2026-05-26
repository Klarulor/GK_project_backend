import { Module } from "@nestjs/common";
import { ElectricityModule } from "src/modules/electricity/electricity.module";
import { NotificationsModule } from "src/modules/notifications/notifications.module";
import { DevicesModule } from "../devices/devices.module";
import { UsersModule } from "../users/users.module";
import { ControlController } from "./control.controller";
import { ControlService } from "./control.service";

@Module({
  imports: [DevicesModule, ElectricityModule, NotificationsModule, UsersModule],
  controllers: [ControlController],
  providers: [ControlService],
})
export class ControlModule {}
