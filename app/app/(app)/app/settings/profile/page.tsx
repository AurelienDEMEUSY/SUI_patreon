'use client';

import Link from 'next/link';
import { PageContainer } from '@/components/layout';
import { EditProfileForm } from '@/components/creator/EditProfileForm';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import { useCreator } from '@/hooks/useCreator';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
    const router = useRouter();
    const { serviceObjectId } = useAutoRegister();
    const { creator, isLoading } = useCreator(null);

    if (isLoading) {
        return (
            <PageContainer maxWidth="max-w-4xl">
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="h-8 w-48 bg-white/6 rounded animate-pulse" />
                    <div className="glass-panel rounded-2xl p-8">
                        <div className="flex flex-col items-center gap-4 mb-8">
                            <div className="w-32 h-32 rounded-2xl bg-white/6 animate-pulse" />
                        </div>
                        <div className="space-y-6">
                            <div className="h-12 bg-white/4 rounded-xl animate-pulse" />
                            <div className="h-24 bg-white/4 rounded-xl animate-pulse" />
                            <div className="h-12 bg-white/4 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </PageContainer>
        );
    }

    if (!creator || !serviceObjectId) {
        return (
            <PageContainer maxWidth="max-w-4xl">
                <div className="max-w-2xl mx-auto glass-panel rounded-2xl p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-600 mb-4">person_off</span>
                    <h2 className="text-xl font-bold text-white mb-2">No Creator Profile</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        You need to create a profile before editing it.
                    </p>
                    <Link
                        href="/app"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-[#3c3cf6] to-[#6366f1] text-white font-bold rounded-xl text-sm"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Go to Dashboard
                    </Link>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer maxWidth="max-w-4xl">
            <div className="space-y-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/app/settings"
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg text-gray-400">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white">Edit Profile</h1>
                        <p className="text-sm text-gray-500">Update your on-chain creator profile</p>
                    </div>
                </div>

                {/* Form card */}
                <div className="glass-panel rounded-2xl p-8 md:p-10">
                    <EditProfileForm
                        creator={creator}
                        serviceObjectId={serviceObjectId}
                        onSuccess={() => {
                            router.refresh();
                        }}
                    />
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-[#3c3cf6]/5 border border-[#3c3cf6]/10">
                    <span className="material-symbols-outlined text-[#3c3cf6] text-lg mt-0.5">info</span>
                    <div className="text-sm text-gray-400 leading-relaxed">
                        <p>
                            Your avatar is stored on <strong className="text-white/80">Walrus</strong> (decentralized storage)
                            and your name & bio are saved on the <strong className="text-white/80">Sui blockchain</strong>.
                            Changes are permanent and visible to everyone.
                        </p>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
