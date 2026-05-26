import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from "class-validator";
import type { ElectricityCountry } from "src/common/types/electricity-price.types";

export class DevicesEditRequestDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(2, 64)
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  connectionType?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(-500)
  priceLimit?: number;

  @ApiProperty()
  @IsOptional()
  @IsIn(["ee", "lv", "lt", "fi"])
  priceLocation?: ElectricityCountry;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  overrideValue?: boolean | null;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  powerKw?: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;
}
