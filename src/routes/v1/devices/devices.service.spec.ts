import { of, throwError } from "rxjs";
import { MetricsService } from "src/modules/metrics/metrics.service";
import { UserRole } from "src/common/types/enums";
import { DevicesService } from "./devices.service";

const owner = { id: 1, role: UserRole.USER };
const device = {
  id: 10,
  uid: "device-1",
  name: "Boiler",
  callbackUrl: "http://device.local",
  isEnabled: false,
  owner,
};

describe("DevicesService", () => {
  afterEach(() => {
    delete process.env.MOCK_DEVICES;
  });

  function serviceWithMocks(
    overrides: Partial<{
      deviceRepository: Record<string, unknown>;
      commandRepository: Record<string, unknown>;
      httpService: Record<string, unknown>;
      metricsService: Record<string, unknown>;
    }> = {},
  ) {
    const deviceRepository = {
      find: jest.fn().mockResolvedValue([{ ...device }]),
      findOne: jest.fn().mockResolvedValue({ ...device }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest
        .fn()
        .mockImplementation((entity: Record<string, unknown>) => entity),
      save: jest
        .fn()
        .mockImplementation((entity: Record<string, unknown>) =>
          Promise.resolve(entity),
        ),
      ...overrides.deviceRepository,
    };
    const commandRepository = {
      create: jest
        .fn()
        .mockImplementation((entity: Record<string, unknown>) => entity),
      save: jest.fn().mockResolvedValue({ id: 1 }),
      find: jest.fn().mockResolvedValue([{ id: 1 }]),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
      ...overrides.commandRepository,
    };
    const httpService = {
      post: jest.fn().mockReturnValue(of({ status: 200 })),
      get: jest.fn().mockReturnValue(of({ status: 200 })),
      ...overrides.httpService,
    };
    const metricsService = {
      recordDeviceCommand: jest.fn(),
      ...overrides.metricsService,
    };

    return {
      service: new DevicesService(
        deviceRepository as never,
        commandRepository as never,
        httpService as never,
        metricsService as unknown as MetricsService,
      ),
      deviceRepository,
      commandRepository,
      httpService,
      metricsService,
    };
  }

  it("lists all devices for admin and own devices for regular user", async () => {
    const { service, deviceRepository } = serviceWithMocks();

    await service.getDevices({ ...owner, role: UserRole.ADMIN } as never);
    await service.getDevices(owner as never);

    expect(deviceRepository.find).toHaveBeenNthCalledWith(1, {
      order: { createdAt: "DESC" },
    });
    expect(deviceRepository.find).toHaveBeenNthCalledWith(2, {
      where: { owner: { id: owner.id } },
      order: { createdAt: "DESC" },
    });
  });

  it("creates, edits, deletes, tests and reads command log", async () => {
    const { service, deviceRepository, commandRepository } = serviceWithMocks();

    await service.createDevice(
      {
        name: "Boiler",
        description: "",
        callbackUrl: "http://device.local",
        priceLimit: 100,
      },
      owner as never,
      owner as never,
    );
    await service.editDevice(
      "device-1",
      { name: "Heat pump", overrideValue: false },
      owner as never,
    );
    await service.deleteDevice("device-1", owner as never);
    await expect(
      service.testConnection("device-1", owner as never),
    ).resolves.toEqual({ ok: true });
    await service.getCommandLog("device-1", owner as never);
    await service.getCommandTimelineByUser(1, new Date());

    expect(deviceRepository.create).toHaveBeenCalled();
    expect(deviceRepository.save).toHaveBeenCalled();
    expect(deviceRepository.delete).toHaveBeenCalledWith({ uid: "device-1" });
    expect(commandRepository.find).toHaveBeenCalled();
    expect(commandRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it("rejects unauthorized access", async () => {
    const { service } = serviceWithMocks();

    await expect(
      service.getDevice("device-1", { id: 2, role: UserRole.USER } as never),
    ).rejects.toThrow("Unauthorized");
  });

  it("returns failed device test when callback fails", async () => {
    process.env.MOCK_DEVICES = "false";
    const { service } = serviceWithMocks({
      httpService: {
        get: jest.fn().mockReturnValue(throwError(() => new Error("offline"))),
      },
    });

    await expect(
      service.testConnection("device-1", owner as never),
    ).resolves.toEqual({ ok: false });
  });

  it("sends device command and logs successful command", async () => {
    const deviceRepository = {
      findOne: jest.fn().mockResolvedValue({ ...device }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    const commandRepository = {
      create: jest
        .fn()
        .mockImplementation((entity: Record<string, unknown>) => entity),
      save: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const httpService = {
      post: jest.fn().mockReturnValue(of({ status: 200 })),
    };
    const metricsService = {
      recordDeviceCommand: jest.fn(),
    };
    const service = new DevicesService(
      deviceRepository as never,
      commandRepository as never,
      httpService as never,
      metricsService as unknown as MetricsService,
    );

    const result = await service.sendCommand("device-1", true, owner as never);

    expect(result.isEnabled).toBe(true);
    expect(commandRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ targetState: true, isSuccess: true }),
    );
    expect(metricsService.recordDeviceCommand).toHaveBeenCalledWith(true);
  });

  it("logs failed command when callback does not respond", async () => {
    process.env.MOCK_DEVICES = "false";
    const deviceRepository = {
      findOne: jest.fn().mockResolvedValue({ ...device }),
      save: jest.fn(),
    };
    const commandRepository = {
      create: jest
        .fn()
        .mockImplementation((entity: Record<string, unknown>) => entity),
      save: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const httpService = {
      post: jest.fn().mockReturnValue(throwError(() => new Error("offline"))),
    };
    const metricsService = {
      recordDeviceCommand: jest.fn(),
    };
    const service = new DevicesService(
      deviceRepository as never,
      commandRepository as never,
      httpService as never,
      metricsService as unknown as MetricsService,
    );

    await expect(
      service.sendCommand("device-1", true, owner as never),
    ).rejects.toThrow("Device callback did not respond");
    expect(commandRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ targetState: true, isSuccess: false }),
    );
    expect(metricsService.recordDeviceCommand).toHaveBeenCalledWith(false);
  });
});
