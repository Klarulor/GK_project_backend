import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class AuthRegisterRequestDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(5, 50)
  username: string;

  @ApiProperty()
  @Length(5, 120)
  @IsString()
  password: string;
}
