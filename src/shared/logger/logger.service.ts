import { Injectable } from "@nestjs/common";

import * as winston from "winston";
import { WinstonTransport as AxiomTransport } from "@axiomhq/winston";
@Injectable()
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.json(),
      defaultMeta: { service: process.env.AXIOM_SERVICE },
      transports: [
        process.env.NODE_ENV !== "development"
          ? new AxiomTransport({
              dataset: process.env.AXIOM_DATASET,
              token: process.env.AXIOM_TOKEN,
            })
          : new winston.transports.Console(),
      ],
    });
  }

  info(message: string) {
    this.logger.log({
      level: "info",
      message,
    });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({
      message,
      trace,
      context,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }
}
