export default function AppPage() {
  return (
    <>
      {/* 
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
      */}

      {/* <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
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
      </div> */}

      <div className="flex items-center justify-center h-[50vh] text-white/30 text-sm font-bold uppercase tracking-widest">
        No creators found
      </div>

      <div className="h-8"></div>
    </>
  );
}
