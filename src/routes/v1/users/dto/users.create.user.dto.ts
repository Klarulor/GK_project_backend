import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class CreateUserDto {
  @IsString()
  @Length(5, 50)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(5, 120)
  password: string;
}
