import { DeviceOverrideState } from "../../common/types/enums";
import {
  calculateHistoricalSavingsReport,
  calculateSavingsReport,
  resolveControlDecision,
} from "./control-calculator";

const device = {
  uid: "device-1",
  name: "Boiler",
  isEnabled: true,
  isCritical: false,
  overrideState: DeviceOverrideState.NONE,
  priceLimit: 100,
  powerKw: 2,
};

describe("control calculator", () => {
  it("switches a device off when price is above threshold", () => {
    const decision = resolveControlDecision(device, 120, false);

    expect(decision.targetState).toBe(false);
    expect(decision.reason).toContain("above");
  });

  it("switches a device on when price is below threshold even if it is currently off", () => {
    const decision = resolveControlDecision(
      { ...device, isEnabled: false },
      50,
      false,
    );

    expect(decision.targetState).toBe(true);
    expect(decision.reason).toContain("within");
  });

  it("keeps critical devices on during vacation mode when price allows it", () => {
    const decision = resolveControlDecision(
      { ...device, isCritical: true },
      50,
      true,
    );

    expect(decision.targetState).toBe(true);
  });

  it("lets manual override win over price logic", () => {
    const decision = resolveControlDecision(
      { ...device, overrideState: DeviceOverrideState.ON },
      500,
      false,
    );

    expect(decision.targetState).toBe(true);
  });

  it("supports off override, vacation mode and negative prices", () => {
    expect(
      resolveControlDecision(
        { ...device, overrideState: DeviceOverrideState.OFF },
        -10,
        false,
      ).targetState,
    ).toBe(false);
    expect(resolveControlDecision(device, 50, true).targetState).toBe(false);
    expect(resolveControlDecision(device, -1, false).targetState).toBe(true);
  });

  it("calculates transparent fixed vs actual savings", () => {
    const report = calculateSavingsReport(
      [device],
      [
        {
          country: "ee",
          timestamp: 1,
          utcTime: "2026-01-01T00:00:00.000Z",
          localTime: "2026-01-01T02:00:00.000+02:00",
          priceEurMwh: 200,
          priceEurKwh: 0.2,
        },
      ],
      0.3,
      false,
    );

    expect(report.fixedCost).toBe(0.6);
    expect(report.actualCost).toBe(0);
    expect(report.saved).toBe(0.6);
  });

  it("calculates historical savings from device command state", () => {
    const report = calculateHistoricalSavingsReport(
      [device],
      [
        {
          country: "ee",
          timestamp: 1767225600,
          utcTime: "2026-01-01T00:00:00.000Z",
          localTime: "2026-01-01T02:00:00.000+02:00",
          priceEurMwh: 200,
          priceEurKwh: 0.2,
        },
      ],
      [
        {
          deviceUid: "device-1",
          targetState: false,
          createdAt: new Date("2025-12-31T23:30:00.000Z"),
        },
      ],
      0.3,
    );

    expect(report.fixedCost).toBe(0.6);
    expect(report.actualCost).toBe(0);
    expect(report.saved).toBe(0.6);
  });

  it("returns zero percent when fixed comparison price is zero", () => {
    const report = calculateSavingsReport([device], [], 0, false);

    expect(report.fixedCost).toBe(0);
    expect(report.savedPercent).toBe(0);
  });
});
