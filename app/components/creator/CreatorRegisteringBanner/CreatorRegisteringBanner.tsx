'use client';

export function CreatorRegisteringBanner() {
    return (
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-10 mb-4">
            <div className="flex items-center gap-3 bg-[#3c3cf6]/10 border border-[#3c3cf6]/30 rounded-2xl px-5 py-3.5">
                <span className="material-symbols-outlined text-[#3c3cf6] animate-spin">progress_activity</span>
                <span className="text-sm text-white font-medium">Setting up your creator profile on-chain...</span>
            </div>
        </div>
    );
}
