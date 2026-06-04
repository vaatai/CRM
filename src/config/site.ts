export const siteConfig = {
  name: 'CRM SaaS',
  description: 'A production-grade CRM SaaS application',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nav: {
    main: [{ title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' as const }],
    settings: [{ title: 'Profile', href: '/profile', icon: 'User' as const }],
  },
} as const;
