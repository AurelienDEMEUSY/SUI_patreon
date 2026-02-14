import { PageContainer } from '@/components/layout';

export default function CreatorHubPage() {
    return (
        <PageContainer maxWidth="max-w-4xl">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#3c3cf6] to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#3c3cf6]/20">
                    <span className="material-symbols-outlined text-3xl text-white">auto_awesome</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Become a Creator</h1>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                    Start earning with your content. Setup tiers, upload posts, and build your community on the decentralized web.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                    <div className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-emerald-400">payments</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Set Up Earnings</h3>
                        <p className="text-xs text-gray-400">Configure subscription tiers and payout methods.</p>
                    </div>

                    <div className="glass-card p-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-blue-400">cloud_upload</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Manage Content</h3>
                        <p className="text-xs text-gray-400">Upload videos, images, and text posts.</p>
                    </div>
                </div>

                <button className="mt-8 px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-xl shadow-white/10">
                    Start Creating Now
                </button>
            </div>
        </PageContainer>
    );
}
