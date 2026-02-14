'use client';

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
    const tabs = [
        { id: 'posts', label: 'Posts', icon: 'grid_view' },
        { id: 'membership', label: 'Membership', icon: 'workspace_premium' },
        { id: 'about', label: 'About', icon: 'info' },
    ];

    return (
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all duration-300 whitespace-nowrap active:scale-95
                        ${activeTab === tab.id
                            ? 'bg-[#3c3cf6] text-white tab-glow'
                            : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                        }
                    `}
                >
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
