import { NextResponse } from 'next/server';

import { isAppError } from './errors';
import { logger } from './logger';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  if (isAppError(error)) {
    logger.warn('API error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });
    return NextResponse.json(
      { success: false, error: { message: error.message, code: error.code } },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  logger.error('Unhandled API error', {
    message,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json(
    { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 }
  );
}

export function withErrorHandling<T>(
  handler: (request: Request) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: Request): Promise<NextResponse<ApiResponse<T> | ApiResponse<never>>> => {
    try {
      return await handler(request);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
