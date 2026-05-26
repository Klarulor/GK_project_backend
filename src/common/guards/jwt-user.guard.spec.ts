import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ADMIN_ONLY_KEY } from "../decorators/admin-only.decorator";
import { AUTH_ONLY_KEY } from "../decorators/authorize.decorator";
import { UserRole } from "../types/enums";
import { JwtUserGuard } from "./jwt-user.guard";

function context(headers: Record<string, string> = {}) {
  const request = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => "handler",
    getClass: () => "class",
  };
}

describe("JwtUserGuard", () => {
  it("rejects protected request without bearer token", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key) => key === AUTH_ONLY_KEY),
    };
    const guard = new JwtUserGuard(
      { verify: jest.fn() } as never,
      reflector as unknown as Reflector,
      {} as never,
    );

    await expect(guard.canActivate(context() as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects non-admin user on admin route", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key) => key === ADMIN_ONLY_KEY),
    };
    const guard = new JwtUserGuard(
      {
        verify: jest.fn().mockResolvedValue({
          id: 1,
          role: UserRole.USER,
          isActive: 1,
        }),
      } as never,
      reflector as unknown as Reflector,
      {} as never,
    );

    await expect(
      guard.canActivate(
        context({ authorization: "Bearer valid-token" }) as never,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
