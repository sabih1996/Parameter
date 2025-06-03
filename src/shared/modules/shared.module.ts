import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../logger/logger.service";
import { Parameter } from "@/db/entities/parameter.entity";
import { RedisCacheModule } from "./redis-cache.module";

@Module({
  imports: [TypeOrmModule.forFeature([Parameter]), RedisCacheModule],
  exports: [
    LoggerService,
    TypeOrmModule.forFeature([Parameter]),
    RedisCacheModule,
  ],
  providers: [LoggerService],
})
export class SharedModule {}
