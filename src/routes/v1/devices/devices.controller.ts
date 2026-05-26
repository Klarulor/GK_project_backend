import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { Authorize } from "src/common/decorators/authorize.decorator";
import { DevicesService } from "./devices.service";
import { User } from "src/common/decorators/current-user.decorator";
import { DevicesGetResponseDto } from "./dto/devices.get.response.dto";
import { DevicesEditRequestDto } from "./dto/devices.edit.request.dto";
import { DevicesCreateRequestDto } from "./dto/devices.create.request.dto";
import { UsersService } from "../users/users.service";
import { UserRole } from "src/common/types/enums";
import { DevicesCommandRequestDto } from "./dto/devices.command.request.dto";
import { DevicesCommandResponseDto } from "./dto/devices.command.response.dto";
import { UserEntity } from "src/database/entities/UserEntity";
import { NotificationsService } from "src/modules/notifications/notifications.service";

@Controller("v1/devices")
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @ApiOperation({ summary: "Get all devices for the authenticated user" })
  @Get()
  @Authorize()
  async getDevices(
    @User() user: UserEntity,
    @Query("owner_id") ownerId: string,
  ): Promise<DevicesGetResponseDto[]> {
    if (!ownerId)
      return (await this.devicesService.getDevices(user)).map(
        (entity) => new DevicesGetResponseDto(entity),
      );
    if (user.role != UserRole.ADMIN)
      throw new ForbiddenException("Unauthorized");
    return (await this.devicesService.getDeviceByUser(parseInt(ownerId))).map(
      (entity) => new DevicesGetResponseDto(entity),
    );
  }

  @ApiOperation({ summary: "Get a specific device by its UID" })
  @Get(":uid")
  @Authorize()
  async getDevice(
    @Param("uid") uid: string,
    @User() user: UserEntity,
  ): Promise<DevicesGetResponseDto> {
    return new DevicesGetResponseDto(
      await this.devicesService.getDevice(uid, user),
    );
  }

  @ApiOperation({ summary: "Create a device" })
  @Post()
  @Authorize()
  async createDevice(
    @Body() body: DevicesCreateRequestDto,
    @User() user: UserEntity,
    @Query("owner_id") ownerId?: string,
  ): Promise<DevicesGetResponseDto> {
    const owner = ownerId
      ? await this.usersService.getUser(parseInt(ownerId))
      : user;
    if (!owner) throw new ForbiddenException("Owner not found");
    const device = await this.devicesService.createDevice(body, owner, user);
    void this.notificationsService.send("Device created", {
      title: "Device created",
      actor: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      device: {
        uid: device.uid,
        name: device.name,
      },
      details: [
        { label: "Owner", value: owner.username },
        { label: "Price limit", value: `${device.priceLimit} EUR/MWh` },
        { label: "Power", value: `${device.powerKw} kW` },
      ],
    });
    return new DevicesGetResponseDto(device);
  }

  @ApiOperation({ summary: "delete a device by its UID" })
  @Delete(":uid")
  @Authorize()
  async deleteDevice(
    @Param("uid") uid: string,
    @User() user: UserEntity,
  ): Promise<void> {
    const device = await this.devicesService.getDevice(uid, user);
    await this.devicesService.deleteDevice(uid, user);
    void this.notificationsService.send("Device deleted", {
      title: "Device deleted",
      actor: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      device: {
        uid: device.uid,
        name: device.name,
      },
    });
  }

  @ApiOperation({ summary: "edit a device by its UID" })
  @Patch(":uid")
  @Authorize()
  async editDevice(
    @Param("uid") uid: string,
    @User() user: UserEntity,
    @Body() body: DevicesEditRequestDto,
  ): Promise<DevicesGetResponseDto> {
    const device = await this.devicesService.editDevice(uid, body, user);
    void this.notificationsService.send("Device updated", {
      title: "Device updated",
      actor: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      device: {
        uid: device.uid,
        name: device.name,
      },
      details: [
        { label: "Price limit", value: `${device.priceLimit} EUR/MWh` },
        { label: "Power", value: `${device.powerKw} kW` },
        { label: "Critical", value: device.isCritical ? "Yes" : "No" },
      ],
    });
    return new DevicesGetResponseDto(device);
  }

  @ApiOperation({ summary: "send a manual command to a device" })
  @Post(":uid/command")
  @Authorize()
  async commandDevice(
    @Param("uid") uid: string,
    @User() user: UserEntity,
    @Body() body: DevicesCommandRequestDto,
  ): Promise<DevicesGetResponseDto> {
    const targetDevice = await this.devicesService.getDevice(uid, user);
    const device = await this.devicesService.sendCommand(
      uid,
      body.targetState,
      user,
      "manual",
      null,
      body.message ?? null,
    );
    void this.notificationsService.send("Manual device command", {
      title: "Manual device command",
      actor: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      device: {
        uid: targetDevice.uid,
        name: targetDevice.name,
      },
      details: [
        { label: "Target state", value: body.targetState ? "On" : "Off" },
        { label: "Manual override", value: body.manualOverride ?? true },
        { label: "Message", value: body.message ?? "-" },
      ],
    });
    if (body.manualOverride ?? true)
      return new DevicesGetResponseDto(
        await this.devicesService.editDevice(
          uid,
          { overrideValue: body.targetState },
          user,
        ),
      );
    return new DevicesGetResponseDto(device);
  }

  @ApiOperation({ summary: "clear manual override" })
  @Post(":uid/override/clear")
  @Authorize()
  async clearOverride(
    @Param("uid") uid: string,
    @User() user: UserEntity,
  ): Promise<DevicesGetResponseDto> {
    const device = await this.devicesService.editDevice(uid, { overrideValue: null }, user);
    void this.notificationsService.send("Manual override cleared", {
      title: "Manual override cleared",
      actor: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      device: {
        uid: device.uid,
        name: device.name,
      },
    });
    return new DevicesGetResponseDto(device);
  }

  @ApiOperation({ summary: "test device connection" })
  @Post(":uid/test")
  @Authorize()
  async testDevice(
    @Param("uid") uid: string,
    @User() user: UserEntity,
  ): Promise<{ ok: boolean }> {
    return this.devicesService.testConnection(uid, user);
  }

  @ApiOperation({ summary: "get device command log" })
  @Get(":uid/commands")
  @Authorize()
  async commandLog(@Param("uid") uid: string, @User() user: UserEntity) {
    return (await this.devicesService.getCommandLog(uid, user)).map(
      (command) => new DevicesCommandResponseDto(command),
    );
  }
}
