import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisCacheService } from "../services/redis-cache.service";
import Redis from "ioredis";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: async (configService: ConfigService) => {
        return new Redis({
          host: configService.get("REDIS_HOST", process.env.REDIS_HOST),
          port: configService.get("REDIS_PORT", Number(process.env.REDIS_PORT)),
          password: configService.get(
            "REDIS_PASSWORD",
            process.env.REDIS_PASSWORD
          ),
          db: configService.get("REDIS_DB", Number(process.env.REDIS_DB)),
        });
      },
      inject: [ConfigService],
    },
    RedisCacheService,
  ],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
