import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { AdminOnly } from "src/common/decorators/admin-only.decorator";
import { UsersGetResponseDto } from "./dto/users.get.response.dto";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/users.create.user.dto";
import { Authorize } from "src/common/decorators/authorize.decorator";
import { User } from "src/common/decorators/current-user.decorator";
import { UserEntity } from "src/database/entities/UserEntity";
import { UsersPreferencesRequestDto } from "./dto/users.preferences.request.dto";
import { UsersEditRequestDto } from "./dto/users.edit.request.dto";

@Controller("v1/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Get all users" })
  @AdminOnly()
  @Get()
  async getUsers(): Promise<UsersGetResponseDto[]> {
    const users = await this.usersService.getUsers();
    return users.map((user) => new UsersGetResponseDto(user));
  }

  @ApiOperation({ summary: "Get self user info" })
  @Authorize()
  @Get("me")
  getSelf(@User() user: UserEntity): UsersGetResponseDto {
    return new UsersGetResponseDto(user);
  }

  @ApiOperation({ summary: "Update self preferences" })
  @Authorize()
  @Patch("me/preferences")
  async updatePreferences(
    @User() user: UserEntity,
    @Body() dto: UsersPreferencesRequestDto,
  ): Promise<UsersGetResponseDto> {
    return new UsersGetResponseDto(
      await this.usersService.updatePreferences(user.id, dto),
    );
  }

  @ApiOperation({ summary: "Get user by ID" })
  @AdminOnly()
  @Get(":id")
  async getUser(@Param("id") id: number): Promise<UsersGetResponseDto | null> {
    const user = await this.usersService.getUser(id);
    return user ? new UsersGetResponseDto(user) : null;
  }

  @ApiOperation({ summary: "Create a new user" })
  @AdminOnly()
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UsersGetResponseDto> {
    const newUser = await this.usersService.createUser(
      dto.email,
      dto.username,
      dto.password,
    );
    return new UsersGetResponseDto(newUser);
  }

  @ApiOperation({ summary: "Edit user" })
  @AdminOnly()
  @Patch(":id")
  async editUser(
    @Param("id") id: number,
    @Body() dto: UsersEditRequestDto,
  ): Promise<UsersGetResponseDto> {
    return new UsersGetResponseDto(await this.usersService.updateUser(id, dto));
  }

  @ApiOperation({ summary: "Deactivate user" })
  @AdminOnly()
  @Post(":id/deactivate")
  async deactivateUser(@Param("id") id: number): Promise<UsersGetResponseDto> {
    return new UsersGetResponseDto(
      await this.usersService.updateUser(id, { isActive: false }),
    );
  }

  @ApiOperation({ summary: "Delete user" })
  @AdminOnly()
  @Post(":id/delete")
  async deleteUser(@Param("id") id: number): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
