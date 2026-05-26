import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ADMIN_ONLY_KEY } from "../decorators/admin-only.decorator";
import { UserEntity } from "src/database/entities/UserEntity";
import { JwtSecurityService } from "src/modules/security/jwt.security.service";
import { UserRole } from "../types/enums";
import { AUTH_ONLY_KEY } from "../decorators/authorize.decorator";

type RequestWithUser = Request & {
  user?: UserEntity;
};

@Injectable()
export class JwtUserGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtSecurityService,
    private readonly reflector: Reflector,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private readonly logger = new Logger(JwtUserGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const adminOnly = this.reflector.getAllAndOverride<boolean>(
      ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const authorize = this.reflector.getAllAndOverride<boolean>(AUTH_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!adminOnly && !authorize) {
      return true;
    }

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.error({
        event: "AUTH_ERROR",
        reason: "JWT_TOKEN_NOT_FOUND",
        path: request.url,
      });
      throw new UnauthorizedException("JWT token not found");
    }

    const user = await this.jwtService.verify(token);
    if (!user || !user.isActive) {
      this.logger.error({
        event: "AUTH_ERROR",
        reason: "USER_NOT_FOUND_OR_INACTIVE",
        path: request.url,
      });
      throw new UnauthorizedException("User not found");
    }

    request.user = user;

    if (adminOnly && user.role != UserRole.ADMIN) {
      this.logger.error({
        event: "AUTH_ERROR",
        reason: "ADMIN_ACCESS_REQUIRED",
        userId: user.id,
        path: request.url,
      });
      throw new ForbiddenException("Admin access required");
    }

    if (authorize && !user) {
      throw new UnauthorizedException("Authorization required");
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer") {
      return undefined;
    }

    return token;
  }
}
