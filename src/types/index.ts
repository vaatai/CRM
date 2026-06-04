export interface NavItem {
  title: string;
  href: string;
  icon: string;
  disabled?: boolean;
}

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
