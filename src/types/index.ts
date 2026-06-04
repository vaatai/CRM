export interface NavItem {
  title: string;
  href: string;
  icon: string;
  disabled?: boolean;
}

export type SystemRole = 'SUPER_ADMIN' | 'USER';
export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST'
  | 'CONVERTED';
export type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'EMAIL_CAMPAIGN'
  | 'COLD_CALL'
  | 'ADVERTISEMENT'
  | 'OTHER';
export type DealStage =
  | 'PROSPECTING'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'OTHER';
export type TagColor = 'GRAY' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | 'PURPLE' | 'PINK';
