import { IsOptional, IsString, Length } from "class-validator";

export class NotificationsTestRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  message?: string;
}
