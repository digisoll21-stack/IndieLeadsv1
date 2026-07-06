import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    data: T;
    meta?: any;
    message?: string;
    statusCode: number;
    timestamp: string;
}

/**
 * World-Class Response Transformer
 * Standardizes all outgoing API responses into a consistent envelope.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => {
                // Handle cases where data already has a meta/message structure
                const result = {
                    data: data?.data !== undefined ? data.data : data,
                    meta: data?.meta || undefined,
                    message: data?.message || 'Success',
                    statusCode,
                    timestamp: new Date().toISOString(),
                };

                // If data is null/undefined, ensure data is null
                if (data === undefined || data === null) {
                    result.data = null;
                }

                return result;
            }),
        );
    }
}
