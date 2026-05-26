import { Module } from "@nestjs/common";
import { V1Module } from "./v1/v1.module";
import { RootModule } from "./root/root.module";

@Module({
  imports: [V1Module, RootModule],
  controllers: [],
  providers: [],
})
export class RestModule {}
