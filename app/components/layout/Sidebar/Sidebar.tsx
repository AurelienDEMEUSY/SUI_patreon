'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { SidebarItem } from './SidebarItem';
import { SIDEBAR_NAV } from '@/constants';
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from '@/components/ui/Dropdown';
import type { SidebarProps } from '@/types';

export function Sidebar({ className = '', isCreator = false, onBecomeCreator }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  if (!account) return null;

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

      {/* Become a Creator CTA */}
      {!isCreator && onBecomeCreator && (
        <div className="w-full mb-4">
          <button
            onClick={onBecomeCreator}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-[#3c3cf6] to-[#6366f1] text-white text-sm font-bold hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] transition-all duration-300 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span className="hidden lg:inline">Become a Creator</span>
          </button>
        </div>
      )}

      {/* User Profile */}
      <div className="mt-auto w-full">
        <Dropdown>
          <DropdownTrigger>
            <div className="glass-card p-3 rounded-xl flex items-center gap-3 w-full cursor-pointer hover:bg-white/10 transition-colors">
              <img
                alt="User Profile"
                className="size-10 rounded-lg object-cover shrink-0"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyuUEAbfXP2Q_hrE8xf0N_pNHv0Ufy1HRdVWxPIx0yf8gUkE4sFPYz27abpMKRQkx7HekBr6Tx1TiLyasPI9M6T3Ucrp9rGk4nQWPhevyQ-05_bk1cfm8gowxKoFGw-_MARvQZQNHh4Hj0EiumAJXCZQqx0aO9ppVpROdTrMpLs6Ji0TYsy6ztczgOT5Mdhca7FKiynkcQs3NGWuDCbzRwyeDrLVeKTp25NhTHIRbWmOAhapq9Jr2bpAYnBOWsa9i2h2rhIu5NIOUG"
              />
              <div className="hidden lg:block overflow-hidden flex-1 min-w-0 text-left">
                <p className="text-sm font-bold truncate">
                  {isCreator ? 'Creator' : 'User'}
                </p>
                <p className="text-xs text-white/40 truncate font-mono">
                  {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                </p>
              </div>
              <button className="hidden lg:block ml-auto text-white/40 hover:text-white">
                <span className="material-symbols-outlined text-sm">more_vert</span>
              </button>
            </div>
          </DropdownTrigger>

          <DropdownContent align="top" className="w-[230px] mb-2 p-2">
            <div className="px-3 py-2">
              <p className="text-sm font-bold text-white">My Wallet</p>
              <p className="text-xs text-white/40 font-mono break-all">{account.address}</p>
            </div>
            <DropdownSeparator />
            <DropdownItem onClick={() => router.push(`/creator/${account.address}`)}>
              <span className="material-symbols-outlined text-lg">person</span>
              Profile
            </DropdownItem>
            <DropdownItem>
              <span className="material-symbols-outlined text-lg">settings</span>
              Settings
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => disconnect()} className="text-red-400 hover:text-red-400 hover:bg-red-500/10">
              <span className="material-symbols-outlined text-lg">logout</span>
              Disconnect
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </aside>
  );
}
