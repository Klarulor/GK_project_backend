import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DevicesService } from "../devices/devices.service";
import { ElectricityService } from "src/modules/electricity/electricity.service";
import { UserEntity } from "src/database/entities/UserEntity";
import {
  calculateHistoricalSavingsReport,
  calculateSavingsReport,
  resolveControlDecision,
  SavingsPeriod,
} from "src/modules/control/control-calculator";
import { DevicesGetResponseDto } from "../devices/dto/devices.get.response.dto";
import { UsersService } from "../users/users.service";
import { NotificationsService } from "src/modules/notifications/notifications.service";
import type { ElectricityPrice } from "src/common/types/electricity-price.types";

@Injectable()
export class ControlService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly electricityService: ElectricityService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly logger = new Logger(ControlService.name);

  @Cron("*/15 * * * *")
  async runScheduledAutomation() {
    this.logger.log({
      event: "AUTOMATION_RUN_STARTED",
      source: "schedule",
    });
    const users = await this.usersService.getActiveUsers();
    for (const user of users) await this.runAutomation(user);
  }

  async getDashboard(user: UserEntity) {
    const [devices, currentPrice, forecast] = await Promise.all([
      this.devicesService.getDevices(user),
      this.electricityService.getCurrentPrice("ee"),
      this.electricityService.getForecast("ee"),
    ]);
    const savings = await this.getSavingsReport(user, "day");

    const effectiveCurrentPrice = this.getControlPriceEurMwh(
      currentPrice.priceEurMwh,
      user.fixedPriceEurKwh,
    );
    const decisions = devices.map((device) => ({
      ...resolveControlDecision(
        device,
        effectiveCurrentPrice,
        user.vacationMode,
      ),
      deviceName: device.name,
      priceEurMwh: effectiveCurrentPrice,
      priceSource: this.getControlPriceSource(user.fixedPriceEurKwh),
    }));

    return {
      user: {
        username: user.username,
        role: user.role,
        fixedPriceEurKwh: user.fixedPriceEurKwh,
        vacationMode: user.vacationMode,
      },
      currentPrice,
      forecast,
      devices: devices.map((device) => new DevicesGetResponseDto(device)),
      decisions,
      savings,
      plannedSavings: calculateSavingsReport(
        devices,
        this.getControlForecast(forecast.slice(0, 24), user.fixedPriceEurKwh),
        user.fixedPriceEurKwh,
        user.vacationMode,
      ),
    };
  }

  async getSavingsReport(user: UserEntity, period: SavingsPeriod = "day") {
    const end = new Date();
    const start = this.getPeriodStart(end, period);
    const devices = await this.devicesService.getDeviceByUser(user.id);
    const priceLocations = new Set(
      devices.map((device) => device.priceLocation),
    );
    const pricesByLocation = await Promise.all(
      [...priceLocations].map((country) =>
        this.electricityService.getStoredRange(country, start, end),
      ),
    );
    const prices = pricesByLocation
      .flat()
      .sort((left, right) => left.timestamp - right.timestamp);
    const commands = await this.devicesService.getCommandTimelineByUser(
      user.id,
      end,
    );

    return calculateHistoricalSavingsReport(
      devices,
      prices,
      commands.map((command) => ({
        deviceUid: command.device.uid,
        targetState: command.targetState,
        createdAt: command.createdAt,
      })),
      user.fixedPriceEurKwh,
    );
  }

  async runAutomation(user: UserEntity) {
    const devices = await this.devicesService.getDeviceByUser(user.id);
    const results: Array<{
      uid: string;
      targetState: boolean;
      reason: string;
      priceEurMwh: number;
      priceSource: string;
      changed: boolean;
      error?: string;
    }> = [];

    for (const device of devices) {
      const price = await this.electricityService.getCurrentPrice(
        device.priceLocation,
      );
      const controlPriceEurMwh = this.getControlPriceEurMwh(
        price.priceEurMwh,
        user.fixedPriceEurKwh,
      );
      const decision = resolveControlDecision(
        device,
        controlPriceEurMwh,
        user.vacationMode,
      );
      const result = {
        ...decision,
        priceEurMwh: controlPriceEurMwh,
        priceSource: this.getControlPriceSource(user.fixedPriceEurKwh),
      };

      if (device.isEnabled === decision.targetState) {
        results.push({ ...result, changed: false });
        continue;
      }

      try {
        await this.devicesService.sendCommand(
          device.uid,
          decision.targetState,
          device.owner,
          "automation",
          controlPriceEurMwh,
          decision.reason,
        );
        await this.notificationsService.send(
          `${device.name} switched ${decision.targetState ? "on" : "off"}: ${decision.reason}`,
          {
            title: "Automation event",
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
              {
                label: "Action",
                value: decision.targetState ? "Switched on" : "Switched off",
              },
              { label: "Reason", value: decision.reason },
              { label: "Price", value: `${controlPriceEurMwh} EUR/MWh` },
              {
                label: "Price source",
                value: this.getControlPriceSource(user.fixedPriceEurKwh),
              },
            ],
          },
        );
        this.logger.log({
          event: "AUTOMATION_DEVICE_SWITCHED",
          userId: user.id,
          uid: device.uid,
          targetState: decision.targetState,
          reason: decision.reason,
          priceEurMwh: controlPriceEurMwh,
          priceSource: this.getControlPriceSource(user.fixedPriceEurKwh),
        });
        results.push({ ...result, changed: true });
      } catch {
        this.logger.error({
          event: "DEVICE_COMMAND_FAILED",
          uid: device.uid,
          targetState: decision.targetState,
          reason: decision.reason,
        });
        await this.notificationsService.send(
          `${device.name} command failed: ${decision.reason}`,
          {
            title: "Automation failed",
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
              { label: "Reason", value: decision.reason },
              {
                label: "Expected state",
                value: decision.targetState ? "On" : "Off",
              },
            ],
          },
        );
        results.push({
          ...result,
          changed: false,
          error: "Device callback failed",
        });
      }
    }

    return { results };
  }

  private getPeriodStart(end: Date, period: SavingsPeriod) {
    const start = new Date(end);
    if (period === "month") {
      start.setMonth(start.getMonth() - 1);
      return start;
    }
    if (period === "week") {
      start.setDate(start.getDate() - 7);
      return start;
    }
    start.setDate(start.getDate() - 1);
    return start;
  }

  private getControlPriceEurMwh(
    exchangePriceEurMwh: number,
    fixedPriceEurKwh: number,
  ) {
    if (fixedPriceEurKwh > 0) return fixedPriceEurKwh * 1000;
    return exchangePriceEurMwh;
  }

  private getControlPriceSource(fixedPriceEurKwh: number) {
    return fixedPriceEurKwh > 0 ? "fixed" : "exchange";
  }

  private getControlForecast(
    forecast: ElectricityPrice[],
    fixedPriceEurKwh: number,
  ): ElectricityPrice[] {
    if (fixedPriceEurKwh <= 0) return forecast;
    const fixedPriceEurMwh = fixedPriceEurKwh * 1000;
    return forecast.map((price) => ({
      ...price,
      priceEurMwh: fixedPriceEurMwh,
      priceEurKwh: fixedPriceEurKwh,
    }));
  }
}
