import { currentUser } from '@clerk/nextjs/server';

import { successResponse, errorResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    logger.info('User profile fetched', { userId: user.id });

    return successResponse({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
