import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import type {
  ElectricityCountry,
  ElectricityPrice,
} from "src/common/types/electricity-price.types";
import { ElectricityService } from "./electricity.service";

@Controller("v1/electricity")
export class ElectricityController {
  constructor(private readonly electricityService: ElectricityService) {}

  @ApiOperation({ summary: "Get current Nord Pool price" })
  @Get("current")
  async current(
    @Query("country") country: ElectricityCountry = "ee",
  ): Promise<ElectricityPrice> {
    return this.electricityService.getCurrentPrice(country);
  }

  @ApiOperation({ summary: "Get next 24h Nord Pool price forecast" })
  @Get("forecast")
  async forecast(
    @Query("country") country: ElectricityCountry = "ee",
  ): Promise<ElectricityPrice[]> {
    return this.electricityService.getForecast(country);
  }
}
