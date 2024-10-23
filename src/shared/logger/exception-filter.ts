import { ExceptionFilter, Catch } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";

import { LoggerService } from "./logger.service";

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}
  catch(exception: RpcException) {
    this.logger.error(exception.message, exception.stack, exception.name);
  }
}
