import { UserRole } from "src/common/types/enums";

export class AuthLoginResponseDto {
  user_id: number;
  username: string;
  role: UserRole;
  jwt_token: string;
}
