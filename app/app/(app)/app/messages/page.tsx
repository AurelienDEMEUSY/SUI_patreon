export default function MessagesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                <span className="material-symbols-outlined text-3xl text-purple-400">forum</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">My Messages</h1>
            <p className="text-gray-400 max-w-sm">
                Connect with creators and other fans. Your conversations will appear here.
            </p>
            <div className="mt-8 p-4 glass-card rounded-xl text-left w-full max-w-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse"></div>
                    </div>
                </div>
            </div>
            <div className="mt-4 p-4 glass-card rounded-xl text-left w-full max-w-md opacity-60">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse"></div>
                        <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
