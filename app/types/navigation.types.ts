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
}

export interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

export interface TopbarProps {
  className?: string;
}
