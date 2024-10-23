import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ParamModule } from "./modules/parameter/parameter.module";
import { DatabaseModule } from "./db/db.module";
import { LoggerService } from "./shared/logger/logger.service";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: async () => ({
        signOptions: {
          algorithm: "RS256",
        },
      }),

      inject: [ConfigService],
    }),

    DatabaseModule,
    ParamModule,
  ],
  controllers: [],
  providers: [LoggerService],
})
export class AppModule {}
