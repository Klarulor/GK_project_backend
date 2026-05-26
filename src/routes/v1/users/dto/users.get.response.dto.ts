import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "src/common/types/enums";
import { UserEntity } from "src/database/entities/UserEntity";

export class UsersGetResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  fixedPriceEurKwh: number;

  @ApiProperty()
  vacationMode: boolean;

  constructor(user: UserEntity | undefined) {
    if (!user) return;
    this.user_id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.role = user.role;
    this.isActive = Boolean(user.isActive);
    this.fixedPriceEurKwh = user.fixedPriceEurKwh;
    this.vacationMode = user.vacationMode;
  }
}
