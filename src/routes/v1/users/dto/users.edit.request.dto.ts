import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class UsersEditRequestDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 50)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(5, 120)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
