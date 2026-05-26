import { Module } from "@nestjs/common";
import { ElectricityService } from "./electricity.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PricePoint } from "src/database/entities/PricePoint";
import { HttpModule } from "@nestjs/axios";
import { ElectricityController } from "./electricity.controller";

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([PricePoint])],
  controllers: [ElectricityController],
  providers: [ElectricityService],
  exports: [ElectricityService],
})
export class ElectricityModule {}
