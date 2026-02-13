'use client';

export function HeroBanner() {
  return (
    <div className="glass-card p-8 mb-8 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3c3cf6]/20 via-purple-600/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[#3c3cf6] text-3xl">
            trending_up
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Discover Amazing Creators
          </h1>
        </div>

        <p className="text-gray-300 text-lg mb-6 max-w-2xl">
          Support your favorite creators and unlock exclusive content. All powered by the SUI blockchain with zero gas fees.
        </p>

        <div className="flex flex-wrap gap-3">
          <button className="px-6 py-3 bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white font-bold rounded-xl transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">explore</span>
            <span>Browse Creators</span>
          </button>
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Become a Creator</span>
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#3c3cf6]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full -mr-24 -mb-24 blur-2xl" />
    </div>
  );
}
