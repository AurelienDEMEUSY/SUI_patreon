export default function AppPage() {
  return (
    <>
      <section className="relative w-full aspect-[21/9] min-h-[300px] rounded-3xl overflow-hidden glass-panel group">
        <img
          alt="Ethereal digital artwork background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY1242EMtBxzwbDY77785jUi7mTjxIcWDZpBlI3ViG0I_icwy2wlLR-WseCoOssNl5-s4Rqn99ItCXAvm0Ng169m-USMqBo58hZAkBfkguPY5eWB5PJ8V0h7XOHCNgBvJxdBq1ZxxaQOuYqh_45L9pEURaA2d1aVYZtRl_ybB6b-nQZEsP9yVTIrIxhvGX7JLogV4skS5QW9uW7YUjjPjWvkO5yqv7w2Pnyku2uAilGv4j7W9hmgaEA2RS083nEsAfIjpxU6YjT-ZJ"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a18] via-transparent to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center p-8 lg:p-12 max-w-2xl">
          <span className="bg-[#3c3cf6]/20 border border-[#3c3cf6]/40 text-[#3c3cf6] px-3 py-1 rounded-full text-xs font-bold w-fit mb-4">
            FEATURED CREATOR
          </span>
          <h1 className="text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Discover Ethereal Artists
          </h1>
          <p className="text-white/70 text-lg mb-8 line-clamp-2">
            Explore the most popular fantasy and digital illustrators in the crystalline collective. Join the inner circle today.
          </p>
          <div className="flex gap-4">
            <button className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-all">
              Explore Now
            </button>
            <button className="glass-card text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-all">
              Trending
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        <button className="glass-card bg-[#3c3cf6]/20 border-[#3c3cf6]/40 px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-lg">auto_awesome</span> All Artists
        </button>
        <button className="glass-card px-5 py-2.5 rounded-full text-sm font-semibold text-white/60 hover:text-white flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-lg">palette</span> Digital Art
        </button>
        <button className="glass-card px-5 py-2.5 rounded-full text-sm font-semibold text-white/60 hover:text-white flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-lg">castle</span> Fantasy
        </button>
        <button className="glass-card px-5 py-2.5 rounded-full text-sm font-semibold text-white/60 hover:text-white flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-lg">music_note</span> Music
        </button>
        <button className="glass-card px-5 py-2.5 rounded-full text-sm font-semibold text-white/60 hover:text-white flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-lg">sports_esports</span> Games
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Trending Creators</h3>
          <a className="text-[#3c3cf6] text-sm font-semibold hover:underline" href="#">
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl overflow-hidden p-4 group">
            <div className="relative h-40 rounded-xl overflow-hidden mb-4">
              <img
                alt="Creator Art Preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB49xh8LkSAvKc1MtIDtUpr_TA-zwa4CCwuS9hoBlt8D6a7Ya20idC7VMy517bOHaVnRoqxHhPu3Kc5BEaogKQntiEs8OSQtOtW5lzSSoJ3scXVkH5RU7mfkyIkQFlEN1XPdrqFAcx7u8_i0hKoYiaq-kLkVMWqxgK8HXQ1Akxki5oCgXr1o2ad6cJLaggU-Jw8KBlzSY95kNCdNdgv3MDI3JebHzaBUFIbYIHY-dsteg6hwvhtibP4LraYHcqBKQ9E5qTCGJlmru2X"
              />
              <div className="absolute top-3 right-3">
                <span className="bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold">
                  TOP 1%
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <img
                alt="Avatar"
                className="size-12 rounded-full border-2 border-white/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdEqQsXPpCGxhlv7LJ3YS2NpJm-0AoBYT870nsq8vQX7Q2oMUI4QuNfHRYZyEp9LYLAX-jR0ekdUoVcyxyvt9tGbPYDYlEDZlC1nwWxioXOY2TIBnCS22vPfFKBw31SFfG3k36R_W5YOFW6_GhCKq5Q-6_HRKhGhx1Lj8HGDr_SCZoXsY044ScVXdGKH4ihhrpodG5nTxsRDJ09yI37fyxOPh50EsZPuLaGtzZVJHRnt47bH2D-Wm2hbOCqSZ3wcZA-05uQi_RdNVn"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold truncate">Luna Void</h4>
                <p className="text-xs text-white/50 mb-3">Concept & Digital Art</p>
                <div className="flex gap-4 text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span> 12.4k
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">description</span> 842
                  </span>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-[#3c3cf6] border border-white/10 hover:border-[#3c3cf6] transition-all text-sm font-bold">
              Join Community
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden p-4 group">
            <div className="relative h-40 rounded-xl overflow-hidden mb-4">
              <img
                alt="Creator Art Preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfzrEa1Qq7JS1I6r5UdAv7LlPfW3KrOsaElKcXGKDbWMG0rxScwes6nxgmYeyL0iXd14IXyjWWNGIzsdOjLx5cRHJtCswdAtTu5oQ9mPov_SEBK9AW6JjsbmHyr5_fbvl-GQha9X93q0VRQ54czk8z4Upg7SpVNfRBthKrJTYH92562AJnkPXR33GUkhG_9-ARwx90aCPYUCj7Ju0dQ7fZ3whr84dnf7RH4TGpDc9flJjpIvSkL_t--FPe55W7xF7KnFtQPEUpH5kr"
              />
              <div className="absolute top-3 right-3">
                <span className="bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold">
                  NEW
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <img
                alt="Avatar"
                className="size-12 rounded-full border-2 border-white/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA6VMgjCh62KJK_0iP_rvo6z4xWTZRKhhpAhQQzjduLVVuFNwV7uU3vLDSq6fzk-_zbomsvD8RXLTHhbItMiQ9QWbUoaKEJbgc6EBhtAmXesJF6B84trNFWHLYQUwU1lfh3cWGkAmTMvUed3aWlHwMeo01XtuDFN74bpXtJqdDu8N2eBMrT0Yk5gFBFTpjW8degzwVbR4UE9ABoMoKhRBwbCLx753tYIN0gNJeQC1jPPfWu2MoZsHMiwe8d5UBPUpinsAvUpuceTcI"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold truncate">Cyber Smith</h4>
                <p className="text-xs text-white/50 mb-3">Cyberpunk Worldbuilding</p>
                <div className="flex gap-4 text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span> 4.1k
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">description</span> 128
                  </span>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-[#3c3cf6] border border-white/10 hover:border-[#3c3cf6] transition-all text-sm font-bold">
              Join Community
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden p-4 group">
            <div className="relative h-40 rounded-xl overflow-hidden mb-4">
              <img
                alt="Creator Art Preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXtXAgTGxVse9RutJA9XoI3AWoQ75csDgKFBR_9h4-8xhf39CooDwK3XpfNJYwGDYVwMcDL-a7d_t5JyUJrKxsjlUx5SD1Rbz6rhWb7IdoO0ANQ2JwUNpepPfXBES3wRxob_h9Sr3c37tT6BDy6d7LcL49xtVkf5uV8qd0jy9oee_UIi-_bVuVg18cqlu1UoxV3P11Kx7xH9GZ9_tJvecBhA11WJNT62Eqt1NSd6p7NImcmxnscXobBKvoNfRUD3jEOGZcDDS3hD5l"
              />
              <div className="absolute top-3 right-3">
                <span className="bg-[#3c3cf6]/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold">
                  POPULAR
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <img
                alt="Avatar"
                className="size-12 rounded-full border-2 border-white/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkrcITpj37nga2UVe-sqMOh6MeT6UfgeF445fY_ETAlKTe3hFhNzCX3WWErWOinFo1u_MhBLpZ6Uz4VyhrP7nN3FJo56m32p0LyPyxESNJEEEOV9xRYUQ-Pw9W2h6zpdE4_xWLXrPDlWT44DPLD6zkrSSVwOPx7tpCWie_aL7RWQhLNeBMy4oFA_RdHhBRdJ9qbdsg2hyml5LqFmH-HJLKWP7-qchheP4ExY_mnY_NDY3lMuvNw6s4HxbLRUrJDKrWXnFW-Ayt27Op"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold truncate">Elara Dawn</h4>
                <p className="text-xs text-white/50 mb-3">Atmospheric Landscapes</p>
                <div className="flex gap-4 text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span> 9.8k
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">description</span> 450
                  </span>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-[#3c3cf6] border border-white/10 hover:border-[#3c3cf6] transition-all text-sm font-bold">
              Join Community
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
          <p className="text-white/40 text-sm font-medium mb-1">Your Earnings This Month</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black">$2,840.00</h2>
            <span className="text-emerald-400 text-sm font-bold mb-2 flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span> +14%
            </span>
          </div>
          <div className="mt-6 flex gap-2">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#3c3cf6] w-[75%]"></div>
            </div>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
              Goal: $4k
            </span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg">Payout Status</h4>
            <p className="text-white/40 text-sm">Next payout scheduled for April 1st.</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                Verified & Ready
              </span>
            </div>
          </div>
          <button className="glass-card px-6 py-3 rounded-xl hover:bg-white/10 font-bold text-sm">
            Manage Payouts
          </button>
        </div>
      </section>

      <div className="h-8"></div>
    </>
  );
}
