export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  requiresAuth?: boolean;
  badge?: number;
}

export interface SidebarProps {
  className?: string;
  isCreator?: boolean;
  onBecomeCreator?: () => void;
}

export interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

export interface TopbarProps {
  className?: string;
}

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  noPadding?: boolean;
  className?: string;
}
