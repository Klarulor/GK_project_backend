import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/database/entities/UserEntity";
import { Repository } from "typeorm/repository/Repository.js";
import { hash, verify } from "argon2";
import { JwtSecurityService } from "src/modules/security/jwt.security.service";
import { UserRole } from "src/common/types/enums";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtSecurityService: JwtSecurityService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async login(email: string, password: string) {
    const targetUser = await this.userRepository.findOneBy({ email });
    if (!targetUser) {
      this.logger.error({
        event: "AUTH_ERROR",
        reason: "USER_NOT_FOUND",
        email,
      });
      throw new BadRequestException("Invalid email or password");
    }
    const isPasswordValid = await verify(targetUser.hashedPassword, password);
    if (!isPasswordValid) {
      this.logger.error({
        event: "AUTH_ERROR",
        reason: "INVALID_PASSWORD",
        userId: targetUser.id,
      });
      throw new BadRequestException("Invalid email or password");
    }

    const jwt = await this.jwtSecurityService.sign(targetUser);

    this.logger.log({
      event: "USER_LOGIN",
      userId: targetUser.id,
      username: targetUser.username,
    });

    return {
      user_id: targetUser.id,
      username: targetUser.username,
      role: targetUser.role,
      jwt_token: jwt,
    };
  }

  async register(email: string, username: string, password: string) {
    const user = await UserEntity.findOne({
      where: [{ email: email }, { username: username }],
    });
    if (user) {
      throw new BadRequestException(
        "User with this email or username already exists",
      );
    }
    const newUser = new UserEntity();
    newUser.email = email;
    newUser.username = username;
    newUser.hashedPassword = await hash(password);
    newUser.role =
      (await this.userRepository.count()) === 0
        ? UserRole.ADMIN
        : UserRole.USER;

    this.logger.log({
      event: "USER_REGISTERED",
      email,
      username,
      role: newUser.role,
    });
    await this.userRepository.save(newUser);
  }
}
