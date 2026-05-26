import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";

export class UsersPreferencesRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPriceEurKwh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vacationMode?: boolean;
}
