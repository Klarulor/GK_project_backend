import { ApiProperty } from "@nestjs/swagger";
import type { ElectricityCountry } from "src/common/types/electricity-price.types";
import { DeviceOverrideState } from "src/common/types/enums";
import { DeviceEntity } from "src/database/entities/DeviceEntity";

export class DevicesGetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  uid: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  callbackUrl: string;

  @ApiProperty()
  connectionType: string;

  @ApiProperty()
  priceLimit: number;

  @ApiProperty()
  priceLocation: ElectricityCountry;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  powerKw: number;

  @ApiProperty()
  isCritical: boolean;

  @ApiProperty()
  stateUpdatedAt: Date;

  @ApiProperty()
  overrideState: DeviceOverrideState;

  constructor(entity: DeviceEntity) {
    this.id = entity.id;
    this.uid = entity.uid;
    this.name = entity.name;
    this.description = entity.description;
    this.callbackUrl = entity.callbackUrl;
    this.connectionType = entity.connectionType;
    this.priceLimit = entity.priceLimit;
    this.priceLocation = entity.priceLocation;
    this.isEnabled = entity.isEnabled;
    this.powerKw = entity.powerKw;
    this.isCritical = entity.isCritical;
    this.stateUpdatedAt = entity.stateUpdatedAt;
    this.overrideState = entity.overrideState;
  }
}
