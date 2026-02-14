'use client';

import Link from 'next/link';
import type { SidebarItemProps } from '@/types';
import { cn } from '@/lib';
import { useUiStore } from '@/stores';

export function SidebarItem({ item, isActive, onClick }: SidebarItemProps) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center rounded-xl transition-all relative group',
        sidebarCollapsed ? 'justify-center p-3' : 'gap-4 px-4 py-3',
        isActive
          ? 'bg-[#3c3cf6] text-white font-semibold shadow-lg shadow-[#3c3cf6]/20'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      )}
    >
      <span className={cn(
        'material-symbols-outlined shrink-0',
        sidebarCollapsed ? 'text-xl' : ''
      )}>
        {item.icon}
      </span>

      {!sidebarCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {sidebarCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          {item.label}
          {item.badge && item.badge > 0 && (
            <span className="ml-2 bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
