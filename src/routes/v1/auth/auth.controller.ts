import { Body, Controller, Post } from "@nestjs/common";
import { AuthLoginRequestDto } from "./dto/auth.login.request.dto";
import { AuthLoginResponseDto } from "./dto/auth.login.response.dto";
import { AuthService } from "./auth.service";
import { ApiOperation } from "@nestjs/swagger";
import { AuthRegisterRequestDto } from "./dto/auth.register.request.dto";

@Controller("v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "User login" })
  @Post("login")
  async login(@Body() dto: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: "User registration" })
  @Post("register")
  async register(@Body() dto: AuthRegisterRequestDto): Promise<void> {
    return this.authService.register(dto.email, dto.username, dto.password);
  }
}
