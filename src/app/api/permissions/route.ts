import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getAuthContext } from '@/lib/rbac';

export async function GET() {
  try {
    await getAuthContext();

    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource for easier UI consumption
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.resource]) grouped[perm.resource] = [];
      grouped[perm.resource].push(perm);
    }

    return successResponse({ permissions, grouped });
  } catch (error) {
    return errorResponse(error);
  }
}
