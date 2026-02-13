'use client';

import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { SidebarItem } from './SidebarItem';
import { SIDEBAR_NAV } from '@/constants';
import type { SidebarProps } from '@/types';

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`glass-panel w-20 lg:w-64 flex flex-col items-center lg:items-stretch py-8 px-4 rounded-2xl shrink-0 ${className}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-10 text-white justify-center lg:justify-start">
        <div className="size-8 bg-[#3c3cf6] rounded-lg flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white font-bold">star</span>
        </div>
        <h2 className="hidden lg:block text-xl font-extrabold tracking-tight">Patreon</h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1 w-full overflow-y-auto no-scrollbar">
        {SIDEBAR_NAV.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* User Profile */}
      <div className="glass-card mt-auto p-3 rounded-xl flex items-center gap-3 w-full cursor-pointer hover:bg-white/10 transition-colors">
        <img
          alt="User Profile"
          className="size-10 rounded-lg object-cover shrink-0"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyuUEAbfXP2Q_hrE8xf0N_pNHv0Ufy1HRdVWxPIx0yf8gUkE4sFPYz27abpMKRQkx7HekBr6Tx1TiLyasPI9M6T3Ucrp9rGk4nQWPhevyQ-05_bk1cfm8gowxKoFGw-_MARvQZQNHh4Hj0EiumAJXCZQqx0aO9ppVpROdTrMpLs6Ji0TYsy6ztczgOT5Mdhca7FKiynkcQs3NGWuDCbzRwyeDrLVeKTp25NhTHIRbWmOAhapq9Jr2bpAYnBOWsa9i2h2rhIu5NIOUG"
        />
        <div className="hidden lg:block overflow-hidden flex-1 min-w-0">
          <p className="text-sm font-bold truncate">Alex Rivier</p>
          <p className="text-xs text-white/40 truncate">Pro Member</p>
        </div>
        <button className="hidden lg:block ml-auto text-white/40 hover:text-white">
          <span className="material-symbols-outlined text-sm">more_vert</span>
        </button>
      </div>
    </aside>
  );
}
