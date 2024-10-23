import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { join } from "path";
import * as dotenv from "dotenv";
import { RpcExceptionFilter } from "./shared/logger/exception-filter";
import { LoggerService } from "./shared/logger/logger.service";
async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${process.env.PORT || 8000}`,
        protoPath: join(
          __dirname,
          process.env.IDL_PATH || "../../idl",
          "parameters.proto"
        ),
        package: "arameter",
      },
    }
  );

  const logger = new LoggerService();
  logger.info("Service started successfully");

  app.useGlobalFilters(new RpcExceptionFilter(logger));

  app.listen();
}

bootstrap();
