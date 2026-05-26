import { ApiProperty } from "@nestjs/swagger";
import { DeviceCommandEntity } from "src/database/entities/DeviceCommandEntity";

export class DevicesCommandResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  targetState: boolean;

  @ApiProperty()
  source: string;

  @ApiProperty()
  priceEurMwh: number | null;

  @ApiProperty()
  message: string | null;

  @ApiProperty()
  isSuccess: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(entity: DeviceCommandEntity) {
    this.id = entity.id;
    this.targetState = entity.targetState;
    this.source = entity.source;
    this.priceEurMwh = entity.priceEurMwh;
    this.message = entity.message;
    this.isSuccess = entity.isSuccess;
    this.createdAt = entity.createdAt;
  }
}
