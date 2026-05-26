import { UserRole } from "src/common/types/enums";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DeviceEntity } from "./DeviceEntity";

@Entity("users")
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  username: string;

  @Column({ type: "tinyint", default: 0 })
  role: UserRole;

  @Column({ name: "hashed_password", type: "varchar", length: 255 })
  hashedPassword: string;

  @Column({ name: "is_active", type: "tinyint", default: 1 })
  isActive: number;

  @Column({ name: "fixed_price_eur_kwh", type: "float", default: 0.18 })
  fixedPriceEurKwh: number;

  @Column({ name: "vacation_mode", type: "tinyint", default: 0 })
  vacationMode: boolean;

  @OneToMany(() => DeviceEntity, (device) => device.owner, {
    cascade: true,
    lazy: true,
  })
  devices: Promise<DeviceEntity[]>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
