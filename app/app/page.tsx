import Link from "next/link";
import { LaunchAppButton } from '@/components/landing/LaunchAppButton';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer';
import { Globe } from "@/components/ui/globe"

export default function Home() {
  return (
    <div className="bg-black font-sans text-gray-300 antialiased selection:bg-[#3c3cf6]/30 selection:text-white min-h-screen">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] glow-indigo rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] glow-violet rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[50%] glow-indigo opacity-50 rounded-full" />
      </div>

      {/* Hero Section */}
      <main className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <StaggerContainer className="flex flex-col items-center w-full">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c3cf6]/10 border border-[#3c3cf6]/20 text-[#3c3cf6] text-xs font-bold uppercase tracking-widest mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3c3cf6] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3c3cf6]" />
                </span>
                Built on SUI Blockchain
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter mb-8 hero-gradient-text">
                Where creators
                <br />
                own their world.
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12 leading-relaxed">
                The first fully decentralized creator platform. Zero gas fees with sponsored transactions,
                encrypted content via Seal, and decentralized storage on Walrus. True ownership, no gatekeepers.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4">
                <LaunchAppButton />
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Stats Visual */}
          <FadeIn delay={0.4} className="mt-24 w-full relative aspect-[21/9] rounded-3xl overflow-hidden border border-white/5 group">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <div
              className="absolute inset-0 bg-center bg-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDE-SqLJjUzPfja1I1LR86Hgnfna9Hf6quzjeCht1E80E3bXtpdVsNAf2gc5mmJxQSZjIAOElPtHWBfvJhPQVoV-n67TVzU08RFpFYIJNuEnzXwg5ewlEQsHFXS7haadUi0Sj6PywejiZLeva1YWaYeTY8acZZNyCFtH5C359VgUljWeZsMwi7LuHtX10X_alsSrXNV85ZODGYNRmyv6Aat0BtaGLMgFwFmEtXOU2bOm5DYKQfCQN3ll0shOiMMseLBGf8yljfCtGSI')",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-20 p-8 w-full max-w-5xl">
                <div className="flex flex-col items-center">
                  <span className="text-white text-4xl font-bold mb-1">100%</span>
                  <span className="text-[#3c3cf6] text-xs font-bold tracking-widest uppercase">Decentralized</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white text-4xl font-bold mb-1">0 Gas</span>
                  <span className="text-[#3c3cf6] text-xs font-bold tracking-widest uppercase">Sponsored Txs</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white text-4xl font-bold mb-1">Walrus</span>
                  <span className="text-[#3c3cf6] text-xs font-bold tracking-widest uppercase">Storage</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white text-4xl font-bold mb-1">Seal</span>
                  <span className="text-[#3c3cf6] text-xs font-bold tracking-widest uppercase">Encryption</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </main>

      {/* Trusted By / Tech Stack */}
      <section className="py-20 border-y border-white/5 bg-black/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-white/40 text-sm font-bold tracking-widest uppercase text-center mb-12">
            Powered by cutting-edge Web3 technology
          </h2>
          <StaggerContainer className="flex flex-wrap justify-center gap-8 md:gap-16 items-center" delay={0.2}>
            <StaggerItem className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-[#3c3cf6]/20 flex items-center justify-center border border-white/10">
                <span className="text-[#3c3cf6] font-bold text-lg">SUI</span>
              </div>
              <span className="text-white font-medium group-hover:text-[#3c3cf6] transition-colors">
                SUI Blockchain
              </span>
            </StaggerItem>
            <StaggerItem className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-purple-400">lock</span>
              </div>
              <span className="text-white font-medium group-hover:text-purple-400 transition-colors">
                Seal Encryption
              </span>
            </StaggerItem>
            <StaggerItem className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-blue-400">cloud</span>
              </div>
              <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                Walrus Storage
              </span>
            </StaggerItem>
            <StaggerItem className="flex items-center gap-4 group cursor-default">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-white/10">
                <span className="material-symbols-outlined text-green-400">verified_user</span>
              </div>
              <span className="text-white font-medium group-hover:text-green-400 transition-colors">
                ZkLogin
              </span>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-24 items-center">
            <FadeIn direction="left" delay={0.2}>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8">
                True Ownership.
                <br />
                No Gatekeepers.
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-10">
                Own your audience data, your content, and your relationship with your fans.
                No algorithms deciding who sees your work. Everything stored on-chain and encrypted.
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-[#3c3cf6]">check_circle</span>
                  <span className="text-white font-medium">Content encrypted with Seal - only subscribers can decrypt</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-[#3c3cf6]">check_circle</span>
                  <span className="text-white font-medium">Files stored on Walrus - decentralized and permanent</span>
                </li>
                <li className="flex gap-4">
                  <span className="material-symbols-outlined text-[#3c3cf6]">check_circle</span>
                  <span className="text-white font-medium">Zero gas fees - all transactions sponsored via Enoki</span>
                </li>
              </ul>
            </FadeIn>
            <FadeIn direction="right" delay={0.4} className="relative">
              <div className="absolute -inset-4 blur-3xl rounded-full" />
              <div className="relative p-8 aspect-square flex items-center justify-center overflow-hidden">
                <Globe />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-16 text-center">
            How It Works
          </h2>
          <StaggerContainer className="grid md:grid-cols-3 gap-8" delay={0.2}>
            <StaggerItem className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-[#3c3cf6]/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#3c3cf6] text-2xl">login</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">1. Sign in with ZkLogin</h3>
              <p className="text-gray-400">
                Use your Google, Twitch, or Apple account to login. Your SUI wallet is derived from your social login - no seed phrases needed.
              </p>
            </StaggerItem>
            <StaggerItem className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-purple-400 text-2xl">upload</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">2. Create & Encrypt</h3>
              <p className="text-gray-400">
                Upload your content - it gets encrypted with Seal and stored on Walrus. Only subscribers with the right tier can decrypt it.
              </p>
            </StaggerItem>
            <StaggerItem className="glass-card p-8">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-green-400 text-2xl">payments</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">3. Earn in SUI</h3>
              <p className="text-gray-400">
                Fans subscribe to your tiers using SUI. All payments are instant, on-chain, and you keep full control of your earnings.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <FadeIn className="max-w-5xl mx-auto rounded-[3rem] bg-[#3c3cf6] overflow-hidden relative group">
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 p-12 md:p-24 text-center">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8">
              Ready to own your future?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12">
              Join the decentralized creator revolution. No middlemen, no censorship,
              just you and your community on the SUI blockchain.
            </p>
            <Link href="/app">
              <button className="bg-white text-[#3c3cf6] font-black px-12 py-5 rounded-2xl text-xl hover:shadow-2xl hover:scale-105 transition-all">
                Get Started Now
              </button>
            </Link>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full -ml-32 -mb-32 blur-3xl" />
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div>
            <div className="flex items-center gap-3 text-white mb-6">
              <div className="w-6 h-6 flex items-center justify-center bg-[#3c3cf6] rounded">
                <span className="material-symbols-outlined text-white text-[14px]">star</span>
              </div>
              <span className="text-lg font-bold tracking-tight">DePatreon</span>
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              The decentralized creator platform built on SUI. True ownership for creators.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-4">
              <span className="text-white font-bold text-xs uppercase tracking-widest">Platform</span>
              <Link href="#features" className="text-sm text-gray-500 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-gray-500 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white font-bold text-xs uppercase tracking-widest">Technology</span>
              <a
                href="https://sui.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                SUI Blockchain
              </a>
              <a
                href="https://docs.walrus.site"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Walrus Storage
              </a>
              <a
                href="https://docs.enoki.mystenlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Enoki
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white font-bold text-xs uppercase tracking-widest">Resources</span>
              <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                Documentation
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                GitHub
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
                Discord
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between text-xs text-gray-600">
          <p>Built on SUI Testnet. Hackathon Project 2024.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
