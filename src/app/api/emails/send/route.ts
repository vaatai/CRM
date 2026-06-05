import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { getAuthContext, requirePermission } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toEmail, subject, htmlBody, contactId, dealId, templateId } = body;

    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      throw new ValidationError('Valid recipient email is required');
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      throw new ValidationError('Email subject is required');
    }
    if (!htmlBody || typeof htmlBody !== 'string' || htmlBody.trim().length === 0) {
      throw new ValidationError('Email body is required');
    }

    const ctx = await getAuthContext();
    requirePermission(ctx, 'create', 'email');

    // Create email record in DB first (status: QUEUED)
    const email = await prisma.email.create({
      data: {
        organizationId: ctx.organizationId,
        senderId: ctx.userId,
        contactId: contactId || null,
        dealId: dealId || null,
        templateId: templateId || null,
        fromEmail: FROM_EMAIL,
        toEmail: toEmail.trim(),
        subject: subject.trim(),
        body: htmlBody.trim(),
        status: 'QUEUED',
      },
    });

    // Try sending via Resend
    if (resend) {
      try {
        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [toEmail.trim()],
          subject: subject.trim(),
          html: htmlBody.trim(),
        });

        if (result.data?.id) {
          await prisma.email.update({
            where: { id: email.id },
            data: {
              resendId: result.data.id,
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          await prisma.emailEvent.create({
            data: {
              emailId: email.id,
              type: 'SENT',
              metadata: JSON.stringify({ resendId: result.data.id }),
            },
          });

          logger.info('Email sent via Resend', { emailId: email.id, resendId: result.data.id });
        }
      } catch (sendError) {
        await prisma.email.update({
          where: { id: email.id },
          data: { status: 'FAILED' },
        });

        await prisma.emailEvent.create({
          data: {
            emailId: email.id,
            type: 'FAILED',
            metadata: JSON.stringify({
              error: sendError instanceof Error ? sendError.message : 'Unknown error',
            }),
          },
        });

        logger.error('Failed to send email via Resend', {
          emailId: email.id,
          error: sendError instanceof Error ? sendError.message : 'Unknown',
        });
      }
    } else {
      // No Resend API key — mark as sent (demo mode)
      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          type: 'SENT',
          metadata: JSON.stringify({ demo: true }),
        },
      });

      logger.info('Email recorded (demo mode, no RESEND_API_KEY)', { emailId: email.id });
    }

    // Also create an Activity record for CRM tracking
    if (contactId) {
      await prisma.activity.create({
        data: {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          contactId,
          dealId: dealId || null,
          type: 'EMAIL',
          title: `Email sent: ${subject.trim()}`,
          description: `Sent email to ${toEmail}`,
        },
      });
    }

    const updatedEmail = await prisma.email.findUnique({
      where: { id: email.id },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        deal: { select: { id: true, title: true } },
        template: { select: { id: true, name: true } },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });

    return successResponse(updatedEmail, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
