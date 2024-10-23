import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../logger/logger.service";
import { Parameter } from "@/db/entities/parameter.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Parameter])],
  exports: [LoggerService, TypeOrmModule.forFeature([Parameter])],
  providers: [LoggerService],
})
export class SharedModule {}
