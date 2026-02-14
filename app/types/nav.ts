export interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: string;
    requiresAuth?: boolean;
    badge?: number;
}
