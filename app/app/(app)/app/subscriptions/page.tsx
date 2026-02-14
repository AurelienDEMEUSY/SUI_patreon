import { PageContainer } from '@/components/layout';

export default function SubscriptionsPage() {
    return (
        <PageContainer>
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 bg-[#3c3cf6]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#3c3cf6]/20">
                    <span className="material-symbols-outlined text-3xl text-[#3c3cf6]">star</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">My Subscriptions</h1>
                <p className="text-gray-400 max-w-sm">
                    You haven't subscribed to any creators yet. Discover amazing content and support your favorite artists.
                </p>
                <button className="mt-8 px-6 py-3 bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white font-bold rounded-xl transition-all">
                    Discover Creators
                </button>
            </div>
        </PageContainer>
    );
}
