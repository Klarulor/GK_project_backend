import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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

export class DevicesCreateRequestDto {
  @ApiProperty()
  @IsString()
  @Length(2, 64)
  name: string;

  @ApiProperty()
  @IsString()
  @Length(0, 255)
  description: string;

  @ApiProperty()
  @IsUrl({ require_tld: false })
  callbackUrl: string;

  @ApiPropertyOptional({ default: "http" })
  @IsOptional()
  @IsString()
  connectionType?: string;

  @ApiProperty()
  @IsNumber()
  @Min(-500)
  priceLimit: number;

  @ApiPropertyOptional({ default: "ee" })
  @IsOptional()
  @IsIn(["ee", "lv", "lt", "fi"])
  priceLocation?: ElectricityCountry;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  powerKw?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;
}
