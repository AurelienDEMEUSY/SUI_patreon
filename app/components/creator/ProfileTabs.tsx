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
        <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200 whitespace-nowrap
                        ${activeTab === tab.id
                            ? 'bg-[#3c3cf6] text-white shadow-lg shadow-[#3c3cf6]/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                        }
                    `}
                >
                    <span className="material-symbols-outlined text-[1.1rem]">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
