'use client';

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
    const tabs = [
        { id: 'posts', label: 'Posts', icon: 'grid_view' },
        { id: 'about', label: 'About', icon: 'info' },
        { id: 'membership', label: 'Membership', icon: 'card_membership' },
    ];

    return (
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
            px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap
            ${activeTab === tab.id
                            ? 'bg-[#3c3cf6] text-white shadow-[0_0_20px_-5px_rgba(60,60,246,0.6)]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }
          `}
                >
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
