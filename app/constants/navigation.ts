import type { NavItem } from '@/types';

export const SIDEBAR_NAV: NavItem[] = [
  {
    id: 'discover',
    label: 'Discover',
    href: '/app',
    icon: 'explore',
    requiresAuth: false,
  },
  {
    id: 'subscriptions',
    label: 'My Subscriptions',
    href: '/app/subscriptions',
    icon: 'star',
    requiresAuth: true,
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/app/messages',
    icon: 'forum',
    requiresAuth: true,
    badge: 3,
  },
  {
    id: 'creator-hub',
    label: 'Creator Hub',
    href: '/app/creator-hub',
    icon: 'auto_awesome',
    requiresAuth: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/app/settings',
    icon: 'settings',
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
