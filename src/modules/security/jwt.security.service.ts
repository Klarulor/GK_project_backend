import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/database/entities/UserEntity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

type JwtPayload = {
  sub: number;
  email: string;
};

@Injectable()
export class JwtSecurityService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async sign(UserEntity: UserEntity): Promise<string> {
    //var jwt = (`SSS-{targetUser.id}-${targetUser.username}`, this.configService.get<string>("JWT_SECRET_KEY")!, { expiresIn: '4h' });
    const payload = { sub: UserEntity.id, email: UserEntity.email };
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_SECRET_KEY")!,
      expiresIn: "8h",
    });
  }

  async verify(jwt: string): Promise<UserEntity | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(jwt, {
        secret: this.configService.get<string>("JWT_SECRET_KEY")!,
      });
      const user = await this.userRepository.findOneBy({ id: payload.sub });
      return user || null;
    } catch {
      throw new UnauthorizedException("Invalid or expired JWT token");
    }
  }
}
