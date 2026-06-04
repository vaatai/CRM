import { cn } from '@/lib/utils';
import { getSourceLabel } from './contact-constants';

const sourceColors: Record<string, string> = {
  WEBSITE: 'bg-blue-100 text-blue-800',
  REFERRAL: 'bg-green-100 text-green-800',
  SOCIAL_MEDIA: 'bg-purple-100 text-purple-800',
  EMAIL_CAMPAIGN: 'bg-yellow-100 text-yellow-800',
  COLD_CALL: 'bg-orange-100 text-orange-800',
  ADVERTISEMENT: 'bg-pink-100 text-pink-800',
  EVENT: 'bg-indigo-100 text-indigo-800',
  PARTNER: 'bg-emerald-100 text-emerald-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

interface ContactSourceBadgeProps {
  source: string;
  className?: string;
}

export function ContactSourceBadge({ source, className }: ContactSourceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        sourceColors[source] || sourceColors.OTHER,
        className
      )}
    >
      {getSourceLabel(source)}
    </span>
  );
}
