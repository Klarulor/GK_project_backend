import { DeviceOverrideState } from "../../common/types/enums";
import type { ElectricityPrice } from "../../common/types/electricity-price.types";

export type ControlDeviceSnapshot = {
  uid: string;
  name: string;
  isEnabled: boolean;
  isCritical: boolean;
  overrideState: DeviceOverrideState;
  priceLimit: number;
  powerKw: number;
};

export type ControlDecision = {
  uid: string;
  targetState: boolean;
  reason: string;
};

export type SavingsPeriod = "day" | "week" | "month";

export type HistoricalCommandSnapshot = {
  deviceUid: string;
  targetState: boolean;
  createdAt: Date;
};

export function resolveControlDecision(
  device: ControlDeviceSnapshot,
  priceEurMwh: number,
  vacationMode: boolean,
): ControlDecision {
  if (device.overrideState === DeviceOverrideState.ON) {
    return {
      uid: device.uid,
      targetState: true,
      reason: "Manual override keeps device on",
    };
  }

  if (device.overrideState === DeviceOverrideState.OFF) {
    return {
      uid: device.uid,
      targetState: false,
      reason: "Manual override keeps device off",
    };
  }

  if (vacationMode && !device.isCritical) {
    return {
      uid: device.uid,
      targetState: false,
      reason: "Vacation mode disables non-critical devices",
    };
  }

  if (priceEurMwh < 0) {
    return {
      uid: device.uid,
      targetState: true,
      reason: "Negative price keeps controllable load on",
    };
  }

  const targetState = device.priceLimit >= priceEurMwh;
  return {
    uid: device.uid,
    targetState,
    reason: targetState
      ? "Price is within device threshold"
      : "Price is above device threshold",
  };
}

export function calculateSavingsReport(
  devices: ControlDeviceSnapshot[],
  prices: ElectricityPrice[],
  fixedPriceEurKwh: number,
  vacationMode: boolean,
) {
  const rows = prices.flatMap((price) =>
    devices.map((device) => {
      const decision = resolveControlDecision(
        device,
        price.priceEurMwh,
        vacationMode,
      );
      const fixedCost = device.powerKw * fixedPriceEurKwh;
      const actualCost = decision.targetState
        ? device.powerKw * price.priceEurKwh
        : 0;

      return {
        deviceUid: device.uid,
        deviceName: device.name,
        localTime: price.localTime,
        fixedCost: round(fixedCost, 4),
        actualCost: round(actualCost, 4),
        saved: round(fixedCost - actualCost, 4),
        targetState: decision.targetState,
      };
    }),
  );

  const fixedCost = round(
    rows.reduce((sum, row) => sum + row.fixedCost, 0),
    4,
  );
  const actualCost = round(
    rows.reduce((sum, row) => sum + row.actualCost, 0),
    4,
  );
  const saved = round(fixedCost - actualCost, 4);

  return {
    fixedCost,
    actualCost,
    saved,
    savedPercent: fixedCost > 0 ? round((saved / fixedCost) * 100, 2) : 0,
    rows,
  };
}

export function calculateHistoricalSavingsReport(
  devices: ControlDeviceSnapshot[],
  prices: ElectricityPrice[],
  commands: HistoricalCommandSnapshot[],
  fixedPriceEurKwh: number,
) {
  const sortedCommands = [...commands].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );

  const rows = prices.flatMap((price) =>
    devices.map((device) => {
      const priceTime = price.timestamp * 1000;
      const latestCommand = [...sortedCommands]
        .filter(
          (command) =>
            command.deviceUid === device.uid &&
            command.createdAt.getTime() <= priceTime,
        )
        .at(-1);
      const targetState = latestCommand?.targetState ?? device.isEnabled;
      const fixedCost = device.powerKw * fixedPriceEurKwh;
      const actualCost = targetState ? device.powerKw * price.priceEurKwh : 0;

      return {
        deviceUid: device.uid,
        deviceName: device.name,
        localTime: price.localTime,
        fixedCost: round(fixedCost, 4),
        actualCost: round(actualCost, 4),
        saved: round(fixedCost - actualCost, 4),
        targetState,
      };
    }),
  );

  const fixedCost = round(
    rows.reduce((sum, row) => sum + row.fixedCost, 0),
    4,
  );
  const actualCost = round(
    rows.reduce((sum, row) => sum + row.actualCost, 0),
    4,
  );
  const saved = round(fixedCost - actualCost, 4);

  return {
    fixedCost,
    actualCost,
    saved,
    savedPercent: fixedCost > 0 ? round((saved / fixedCost) * 100, 2) : 0,
    rows,
  };
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}
