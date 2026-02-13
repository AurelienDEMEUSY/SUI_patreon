'use client';

import Link from 'next/link';
import type { SidebarItemProps } from '@/types';
import { cn } from '@/lib';

export function SidebarItem({ item, isActive, onClick }: SidebarItemProps) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-xl transition-all',
        isActive
          ? 'bg-[#3c3cf6] text-white font-semibold shadow-lg shadow-[#3c3cf6]/20'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      )}
    >
      <span className="material-symbols-outlined">{item.icon}</span>
      <span className="hidden lg:block">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
