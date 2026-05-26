import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("price_points")
export class PricePoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 10 })
  location: string;

  @Column({ type: "timestamp" })
  timestamp: Date;

  @Column({ type: "float" })
  priceEurMwh: number;
}
