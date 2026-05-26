import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { UserRole } from "src/common/types/enums";
import { DeviceCommandEntity } from "src/database/entities/DeviceCommandEntity";
import { DeviceEntity } from "src/database/entities/DeviceEntity";
import { UserEntity } from "src/database/entities/UserEntity";
import { Repository } from "typeorm/repository/Repository.js";
import { DevicesEditRequestDto } from "./dto/devices.edit.request.dto";
import { firstValueFrom } from "rxjs";
import { DevicesCreateRequestDto } from "./dto/devices.create.request.dto";
import { MetricsService } from "src/modules/metrics/metrics.service";

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(DeviceCommandEntity)
    private commandRepository: Repository<DeviceCommandEntity>,
    private readonly httpService: HttpService,
    private readonly metricsService: MetricsService,
  ) {}

  private readonly logger = new Logger(DevicesService.name);

  async getDevices(user: UserEntity): Promise<DeviceEntity[]> {
    if (user.role === UserRole.ADMIN)
      return this.deviceRepository.find({ order: { createdAt: "DESC" } });
    return this.deviceRepository.find({
      where: { owner: { id: user.id } },
      order: { createdAt: "DESC" },
    });
  }
  async getDevice(uid: string, requester: UserEntity): Promise<DeviceEntity> {
    const target = await this.deviceRepository.findOne({ where: { uid } });
    if (!target) throw new NotFoundException("Device not found");
    if (target.owner.id !== requester.id && requester.role != UserRole.ADMIN)
      throw new ForbiddenException("Unauthorized");
    return target;
  }
  async getDeviceByUser(userId: number): Promise<DeviceEntity[]> {
    return this.deviceRepository.find({ where: { owner: { id: userId } } });
  }
  async deleteDevice(uid: string, requester: UserEntity): Promise<void> {
    const target = await this.deviceRepository.findOne({ where: { uid } });
    if (!target) throw new NotFoundException("Device not found");
    if (target.owner.id !== requester.id && requester.role != UserRole.ADMIN)
      throw new ForbiddenException("Unauthorized");
    await this.deviceRepository.delete({ uid });
  }
  async createDevice(
    deviceData: DevicesCreateRequestDto,
    owner: UserEntity,
    requester: UserEntity,
  ): Promise<DeviceEntity> {
    const newDevice = this.deviceRepository.create({
      ...deviceData,
      priceLocation: deviceData.priceLocation ?? "ee",
      powerKw: deviceData.powerKw ?? 1,
      isCritical: deviceData.isCritical ?? false,
      connectionType: deviceData.connectionType ?? "http",
      owner,
    });
    if (owner.id !== requester.id && requester.role != UserRole.ADMIN)
      throw new ForbiddenException("Unauthorized");
    return await this.deviceRepository.save(newDevice);
  }
  async editDevice(
    uid: string,
    dto: DevicesEditRequestDto,
    requester: UserEntity,
  ): Promise<DeviceEntity> {
    const target = await this.getDevice(uid, requester);
    if (dto.name !== undefined) target.name = dto.name;
    if (dto.description !== undefined) target.description = dto.description;
    if (dto.callbackUrl !== undefined) target.callbackUrl = dto.callbackUrl;
    if (dto.connectionType !== undefined) target.connectionType = dto.connectionType;
    if (dto.priceLimit !== undefined) target.priceLimit = dto.priceLimit;
    if (dto.priceLocation !== undefined) target.priceLocation = dto.priceLocation;
    if (dto.overrideValue !== undefined) target.overrideState = dto.overrideValue === null ? 0 : dto.overrideValue ? 1 : 2;
    if (dto.powerKw !== undefined) target.powerKw = dto.powerKw;
    if (dto.isCritical !== undefined) target.isCritical = dto.isCritical;
    return await this.deviceRepository.save(target);
    
}

  async sendCommand(
    uid: string,
    targetState: boolean,
    requester: UserEntity,
    source = "manual",
    priceEurMwh: number | null = null,
    message: string | null = null,
  ): Promise<DeviceEntity> {
    const target = await this.getDevice(uid, requester);

    try {
      await firstValueFrom(
        this.httpService.post(
          target.callbackUrl,
          {
            uid: target.uid,
            enabled: targetState,
            source,
          },
          { timeout: 5000 },
        ),
      );
    } catch {
        if(process.env.MOCK_DEVICES !== "true"){
            await this.logCommand(
            target,
            targetState,
            source,
            priceEurMwh,
            message ?? "Device callback did not respond",
            false,
        );
        this.metricsService.recordDeviceCommand(false);
        this.logger.error({
          event: "DEVICE_COMMAND_FAILED",
          uid: target.uid,
          name: target.name,
          targetState,
          source,
          priceEurMwh,
        });
            throw new ServiceUnavailableException("Device callback did not respond");
        }
    }

    target.isEnabled = targetState;
    target.stateUpdatedAt = new Date();

    await this.logCommand(
      target,
      targetState,
      source,
      priceEurMwh,
      message,
      true,
    );
    this.metricsService.recordDeviceCommand(true);
    this.logger.log({
      event: "DEVICE_SWITCHED",
      uid: target.uid,
      name: target.name,
      targetState,
      source,
      priceEurMwh,
    });
    return this.deviceRepository.save(target);
  }

  private async logCommand(
    device: DeviceEntity,
    targetState: boolean,
    source: string,
    priceEurMwh: number | null,
    message: string | null,
    isSuccess: boolean,
  ) {
    const command = this.commandRepository.create({
      device,
      targetState,
      source,
      priceEurMwh,
      message,
      isSuccess,
    });
    await this.commandRepository.save(command);
  }

  async testConnection(
    uid: string,
    requester: UserEntity,
  ): Promise<{ ok: boolean }> {
    const target = await this.getDevice(uid, requester);
    console.log(process.env.MOCK_DEVICES);
    if(process.env.MOCK_DEVICES == "true"){
        this.logger.log({
            event: "DEVICE_CONNECTION_TESTED",
            uid: target.uid,
            ok: true,
        });
        return { ok: true };
    }
    try {
      await firstValueFrom(
        this.httpService.get(target.callbackUrl, { timeout: 5000 }),
      );
      this.logger.log({
        event: "DEVICE_CONNECTION_TESTED",
        uid: target.uid,
        ok: true,
      });
      return { ok: true };
    } catch {
      this.logger.warn({
        event: "DEVICE_CONNECTION_TEST_FAILED",
        uid: target.uid,
        callbackUrl: target.callbackUrl,
      });
      return { ok: false };
    }
  }

  async getCommandLog(
    uid: string,
    requester: UserEntity,
  ): Promise<DeviceCommandEntity[]> {
    const target = await this.getDevice(uid, requester);
    return this.commandRepository.find({
      where: { device: { id: target.id } },
      order: { createdAt: "DESC" },
      take: 50,
    });
  }

  async getCommandTimelineByUser(
    userId: number,
    end: Date,
  ): Promise<DeviceCommandEntity[]> {
    return this.commandRepository
      .createQueryBuilder("command")
      .leftJoinAndSelect("command.device", "device")
      .leftJoinAndSelect("device.owner", "owner")
      .where("owner.id = :userId", { userId })
      .andWhere("command.createdAt <= :end", { end })
      .andWhere("command.isSuccess = :isSuccess", { isSuccess: true })
      .orderBy("command.createdAt", "ASC")
      .getMany();
  }
}
