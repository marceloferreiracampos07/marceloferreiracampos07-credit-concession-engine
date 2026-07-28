import winston from 'winston';
import { ILogger } from '../../domain/logger.interface.js';

export class WinstonLoggerAdapter implements ILogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  info(message: string): void {
    this.logger.info(message);
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message} - ${error.message}`, { stack: error.stack });
    } else {
      this.logger.error(`${message}`, { error });
    }
  }

  warn(message: string): void {
    this.logger.warn(message);
  }
}
