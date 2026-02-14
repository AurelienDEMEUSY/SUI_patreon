'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { PanelLeftOpen, PanelLeftClose, Star, PlusCircle, MoreVertical, User, Settings, LogOut } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { SIDEBAR_NAV } from '@/constants';
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from '@/components/ui/Dropdown';
import { useUiStore } from '@/stores';
import type { SidebarProps } from '@/types';

export function Sidebar({ className = '', isCreator = false, onBecomeCreator }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  if (!account) return null;

  return (
    <aside
      className={`glass-panel flex flex-col py-8 rounded-2xl shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20 px-2' : 'w-64 px-4'
        } ${className}`}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center mb-10 text-white relative w-full">
        {sidebarCollapsed ? (
          // Collapsed: just the toggle button centered (no star)
          <div className="flex items-center justify-center w-full">
            <button
              onClick={toggleSidebar}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        ) : (
          // Expanded: toggle button + star logo + text
          <div className="flex items-center gap-3 w-full justify-between px-2">
            <button
              onClick={toggleSidebar}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
            <div className="flex items-center gap-2">
              <h1 className='font-bold text-xl'>DePatreon</h1>
              <div className="size-8 bg-[#3c3cf6] rounded-lg flex items-center justify-center shrink-0">
                <Star className="text-white" size={20} fill="currentColor" />
              </div>
            </div>
          </div>
        )}
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
            className={`w-full flex items-center rounded-xl bg-gradient-to-r from-[#3c3cf6] to-[#6366f1] text-white text-sm font-bold hover:shadow-[0_0_30px_-5px_rgba(60,60,246,0.5)] transition-all duration-300 active:scale-[0.98] ${sidebarCollapsed ? 'justify-center p-3' : 'justify-start gap-3 px-4 py-3'
              }`}
          >
            <PlusCircle size={20} />
            {!sidebarCollapsed && <span>Become a Creator</span>}
          </button>
        </div>
      )}

      {/* User Profile */}
      <div className="mt-auto w-full">
        <Dropdown>
          <DropdownTrigger>
            <div className={`glass-card rounded-xl flex items-center w-full cursor-pointer hover:bg-white/10 transition-colors ${sidebarCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'
              }`}>
              <img
                alt="User Profile"
                className="rounded-lg object-cover shrink-0 size-10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyuUEAbfXP2Q_hrE8xf0N_pNHv0Ufy1HRdVWxPIx0yf8gUkE4sFPYz27abpMKRQkx7HekBr6Tx1TiLyasPI9M6T3Ucrp9rGk4nQWPhevyQ-05_bk1cfm8gowxKoFGw-_MARvQZQNHh4Hj0EiumAJXCZQqx0aO9ppVpROdTrMpLs6Ji0TYsy6ztczgOT5Mdhca7FKiynkcQs3NGWuDCbzRwyeDrLVeKTp25NhTHIRbWmOAhapq9Jr2bpAYnBOWsa9i2h2rhIu5NIOUG"
              />
              {!sidebarCollapsed && (
                <>
                  <div className="overflow-hidden flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold truncate">
                      {isCreator ? 'Creator' : 'User'}
                    </p>
                    <p className="text-xs text-white/40 truncate font-mono">
                      {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    </p>
                  </div>
                  <button className="ml-auto text-white/40 hover:text-white">
                    <MoreVertical size={20} />
                  </button>
                </>
              )}
            </div>
          </DropdownTrigger>

          <DropdownContent align="top" className="w-[230px] mb-2 p-2">
            <div className="px-3 py-2">
              <p className="text-sm font-bold text-white">My Wallet</p>
              <p className="text-xs text-white/40 font-mono break-all">{account.address}</p>
            </div>
            <DropdownSeparator />
            <DropdownItem onClick={() => router.push(`/creator/${account.address}`)}>
              <User size={20} />
              Profile
            </DropdownItem>
            <DropdownItem>
              <Settings size={20} />
              Settings
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => disconnect()} className="text-red-400 hover:text-red-400 hover:bg-red-500/10">
              <LogOut size={20} />
              Disconnect
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </aside>
  );
}
