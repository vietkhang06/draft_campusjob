import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Đã xảy ra lỗi trên hệ thống. Vui lòng thử lại sau.';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        code = this.codeFromStatus(statusCode);
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = Array.isArray(resObj.message)
          ? resObj.message.join('; ')
          : resObj.message || message;
        code = resObj.code || resObj.error || this.codeFromStatus(statusCode);
        details = resObj.details || (Array.isArray(resObj.message) ? resObj.message : undefined);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      if (/Unique constraint/i.test(exception.message)) {
        statusCode = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        message = 'Dữ liệu đã tồn tại hoặc thao tác đã được xử lý.';
      }
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    });
  }

  private codeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 405:
        return 'METHOD_NOT_ALLOWED';
      case 409:
        return 'CONFLICT';
      case 413:
        return 'PAYLOAD_TOO_LARGE';
      case 428:
        return 'PRECONDITION_REQUIRED';
      case 429:
        return 'TOO_MANY_REQUESTS';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'ERROR';
    }
  }
}
