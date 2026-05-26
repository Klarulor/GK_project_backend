import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { Authorize } from "src/common/decorators/authorize.decorator";
import { User } from "src/common/decorators/current-user.decorator";
import { UserEntity } from "src/database/entities/UserEntity";
import { NotificationsTestRequestDto } from "./dto/notifications.test.request.dto";
import { NotificationsService } from "./notifications.service";

@Controller("v1/notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "Send a test notification to configured channel" })
  @Post("test")
  @Authorize()
  async test(
    @User() user: UserEntity,
    @Body() dto: NotificationsTestRequestDto,
  ) {
    return this.notificationsService.send(
      dto.message ?? `EECS test notification for ${user.username}`,
      {
        title: "Notification test",
        actor: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    );
  }
}
