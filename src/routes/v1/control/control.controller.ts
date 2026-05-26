import { Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { Authorize } from "src/common/decorators/authorize.decorator";
import { User } from "src/common/decorators/current-user.decorator";
import { UserEntity } from "src/database/entities/UserEntity";
import { ControlService } from "./control.service";
import type { SavingsPeriod } from "src/modules/control/control-calculator";

@Controller("v1/control")
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @ApiOperation({ summary: "Get control center dashboard data" })
  @Get()
  @Authorize()
  async dashboard(@User() user: UserEntity) {
    return this.controlService.getDashboard(user);
  }

  @ApiOperation({ summary: "Run automation cycle for accessible devices" })
  @Post("automation/run")
  @Authorize()
  async runAutomation(@User() user: UserEntity) {
    return this.controlService.runAutomation(user);
  }

  @ApiOperation({ summary: "Get historical savings report" })
  @Get("savings")
  @Authorize()
  async savings(
    @User() user: UserEntity,
    @Query("period") period: SavingsPeriod = "day",
  ) {
    return this.controlService.getSavingsReport(user, period);
  }
}
