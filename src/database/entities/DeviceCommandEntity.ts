import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DeviceEntity } from "./DeviceEntity";

@Entity("device_commands")
export class DeviceCommandEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DeviceEntity, (device) => device.commands, {
    onDelete: "CASCADE",
    eager: true,
  })
  device: DeviceEntity;

  @Column({ name: "target_state", type: "tinyint" })
  targetState: boolean;

  @Column({ type: "varchar", length: 32 })
  source: string;

  @Column({ name: "price_eur_mwh", type: "float", nullable: true })
  priceEurMwh: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  message: string | null;

  @Column({ name: "is_success", type: "tinyint", default: 1 })
  isSuccess: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
