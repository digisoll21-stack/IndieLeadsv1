import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request['requestId'];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal system failure';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' ? (exceptionResponse as any).message : exceptionResponse;
      errorCode = typeof exceptionResponse === 'object' ? (exceptionResponse as any).error || 'HTTP_EXCEPTION' : 'HTTP_EXCEPTION';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`[${requestId}] Critical Error: ${exception.stack}`);
    }

    const errorResponse = {
      data: null,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message.join('. ') : message,
        path: request.url,
        requestId,
      },
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    // Use warn for non-500, error for 500
    if (status >= 500) {
      this.logger.error(`[${requestId}] ${request.method} ${request.url} - Error: ${errorResponse.error.message}`);
    } else {
      this.logger.warn(`[${requestId}] ${request.method} ${request.url} - Client Error: ${status}`);
    }

    response.status(status).json(errorResponse);
  }
}