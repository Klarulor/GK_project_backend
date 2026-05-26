import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { hash } from "argon2";
import { UserEntity } from "src/database/entities/UserEntity";
import { Repository } from "typeorm";
import { UsersPreferencesRequestDto } from "./dto/users.preferences.request.dto";
import { UsersEditRequestDto } from "./dto/users.edit.request.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async getUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find();
  }
  async getActiveUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find({ where: { isActive: 1 } });
  }
  async getUser(id: number): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ id });
  }
  async createUser(
    email: string,
    username: string,
    password: string,
  ): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.email = email;
    newUser.username = username;
    newUser.hashedPassword = await hash(password);
    return await this.usersRepository.save(newUser);
  }
  async editUser(
    id: number,
    email?: string,
    username?: string,
    password?: string,
  ): Promise<UserEntity | null> {
    const target = await this.usersRepository.findOneBy({ id });
    if (!target) throw new NotFoundException("User not found");
    if (email) target.email = email;
    if (username) target.username = username;
    if (password) target.hashedPassword = await hash(password);
    return this.usersRepository.save(target);
  }
  async updateUser(id: number, dto: UsersEditRequestDto): Promise<UserEntity> {
    const target = await this.usersRepository.findOneBy({ id });
    if (!target) throw new NotFoundException("User not found");
    if (dto.email !== undefined) target.email = dto.email;
    if (dto.username !== undefined) target.username = dto.username;
    if (dto.password !== undefined)
      target.hashedPassword = await hash(dto.password);
    if (dto.isActive !== undefined) target.isActive = dto.isActive ? 1 : 0;
    return this.usersRepository.save(target);
  }
  async updatePreferences(
    id: number,
    dto: UsersPreferencesRequestDto,
  ): Promise<UserEntity> {
    const target = await this.usersRepository.findOneBy({ id });
    if (!target) throw new NotFoundException("User not found");
    if (dto.fixedPriceEurKwh !== undefined)
      target.fixedPriceEurKwh = dto.fixedPriceEurKwh;
    if (dto.vacationMode !== undefined) target.vacationMode = dto.vacationMode;
    return this.usersRepository.save(target);
  }
  async deleteUser(id: number): Promise<void> {
    if (!(await this.usersRepository.findOneBy({ id })))
      throw new NotFoundException("User not found");
    await this.usersRepository.delete({ id });
  }
}
