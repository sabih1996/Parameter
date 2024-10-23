import { Module } from "@nestjs/common";
import { ParamService } from "./parameter.service";
import { SharedModule } from "src/shared/modules/shared.module";
import { ParamController } from "./parameter.controller";

@Module({
  imports: [SharedModule],
  controllers: [ParamController],
  providers: [ParamService],
  exports: [ParamService],
})
export class ParamModule {}
