import type { ElectricityCountry } from "src/common/types/electricity-price.types";
import { DeviceOverrideState } from "src/common/types/enums";
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./UserEntity";
import { DeviceCommandEntity } from "./DeviceCommandEntity";

@Entity("devices")
export class DeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 36, unique: true })
  @Generated("uuid")
  uid: string;

  @Column({ type: "varchar", length: 64 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  description: string;

  @Column({ name: "callback_url", type: "varchar", length: 255 })
  callbackUrl: string;

  @Column({
    name: "connection_type",
    type: "varchar",
    length: 32,
    default: "http",
  })
  connectionType: string;

  @Column({ name: "price_limit", type: "float", default: 10 })
  priceLimit: number;

  @Column({ name: "price_location", type: "varchar", length: 2, default: "ee" })
  priceLocation: ElectricityCountry;

  @Column({ name: "power_kw", type: "float", default: 1 })
  powerKw: number;

  @Column({ name: "is_critical", type: "tinyint", default: 0 })
  isCritical: boolean;

  @Column({ name: "is_enabled", type: "tinyint", default: 1 })
  isEnabled: boolean;

  @Column({ name: "state_updated_at", type: "timestamp", nullable: true })
  stateUpdatedAt: Date;

  @Column({ name: "override_state", type: "tinyint", default: 0 })
  overrideState: DeviceOverrideState;

  @ManyToOne(() => UserEntity, (user) => user.devices, {
    onDelete: "CASCADE",
    eager: true,
  })
  owner: UserEntity;

  @OneToMany(() => DeviceCommandEntity, (command) => command.device, {
    cascade: true,
  })
  commands: DeviceCommandEntity[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
