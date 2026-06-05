import { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    click?: { link?: string };
  };
  created_at: string;
}

const EVENT_MAP: Record<string, 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED'> = {
  'email.sent': 'SENT',
  'email.delivered': 'DELIVERED',
  'email.opened': 'OPENED',
  'email.clicked': 'CLICKED',
  'email.bounced': 'BOUNCED',
  'email.complained': 'COMPLAINED',
  'email.delivery_delayed': 'FAILED',
};

const STATUS_MAP: Record<string, 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED'> = {
  'email.delivered': 'DELIVERED',
  'email.opened': 'OPENED',
  'email.clicked': 'CLICKED',
  'email.bounced': 'BOUNCED',
  'email.delivery_delayed': 'FAILED',
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ResendWebhookPayload;
    const { type, data, created_at } = payload;

    logger.info('Email webhook received', { type, emailId: data.email_id });

    const eventType = EVENT_MAP[type];
    if (!eventType || !data.email_id) {
      return new Response('OK', { status: 200 });
    }

    // Find the email by resendId
    const email = await prisma.email.findUnique({
      where: { resendId: data.email_id },
    });

    if (!email) {
      logger.warn('Email not found for webhook', { resendId: data.email_id });
      return new Response('OK', { status: 200 });
    }

    // Create event record
    await prisma.emailEvent.create({
      data: {
        emailId: email.id,
        type: eventType,
        metadata: JSON.stringify(payload),
        occurredAt: new Date(created_at),
      },
    });

    // Update email status and tracking fields
    const updateData: Record<string, unknown> = {};

    const newStatus = STATUS_MAP[type];
    if (newStatus) {
      updateData.status = newStatus;
    }

    if (type === 'email.opened') {
      updateData.openCount = { increment: 1 };
      if (!email.openedAt) {
        updateData.openedAt = new Date(created_at);
      }
    }

    if (type === 'email.clicked') {
      updateData.clickCount = { increment: 1 };
      if (!email.clickedAt) {
        updateData.clickedAt = new Date(created_at);
      }
    }

    if (type === 'email.delivered' && !email.sentAt) {
      updateData.sentAt = new Date(created_at);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.email.update({
        where: { id: email.id },
        data: updateData,
      });
    }

    logger.info('Email event processed', { emailId: email.id, type: eventType });

    return new Response('OK', { status: 200 });
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return new Response('OK', { status: 200 });
  }
}
