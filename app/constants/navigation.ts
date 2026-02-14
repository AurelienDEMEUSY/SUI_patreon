import type { NavItem } from '@/types';

export const SIDEBAR_NAV: NavItem[] = [
  {
    id: 'discover',
    label: 'Discover',
    href: '/app',
    icon: 'Compass',
    requiresAuth: false,
  },
  {
    id: 'subscriptions',
    label: 'My Subscriptions',
    href: '/app/subscriptions',
    icon: 'Heart',
    requiresAuth: true,
  },
  {
    id: 'creator-hub',
    label: 'Creator Hub',
    href: '/app/creator-hub',
    icon: 'LayoutDashboard',
    requiresAuth: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/app/settings',
    icon: 'Settings',
    requiresAuth: true,
  },
];

export const CREATOR_NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/creator/dashboard',
    icon: 'dashboard',
    requiresAuth: true,
  },
  {
    id: 'content',
    label: 'Content',
    href: '/creator/content',
    icon: 'video_library',
    requiresAuth: true,
  },
  {
    id: 'subscribers',
    label: 'Subscribers',
    href: '/creator/subscribers',
    icon: 'group',
    requiresAuth: true,
  },
  {
    id: 'earnings',
    label: 'Earnings',
    href: '/creator/earnings',
    icon: 'payments',
    requiresAuth: true,
  },
];
