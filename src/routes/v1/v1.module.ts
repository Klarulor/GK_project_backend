import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DevicesModule } from "./devices/devices.module";
import { ControlModule } from "./control/control.module";

@Module({
  imports: [AuthModule, UsersModule, DevicesModule, ControlModule],
  providers: [],
  controllers: [],
})
export class V1Module {}
