import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Bot, Building2, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <BrandLogo className="mb-8 h-auto w-48 sm:w-60"/>
          <span className="rounded-full bg-lime px-4 py-2 text-xs font-bold uppercase tracking-widest">A smarter property search</span>
          <h1 className="mt-7 text-5xl font-black leading-[.95] tracking-tight md:text-7xl">Tell us how you want to live.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/65">Realtors X listens to what matters, searches live listings, and introduces you to the right agent—without the endless tabs.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/chat" className="btn gap-2">Start your search <ArrowRight size={17}/></Link>
            <Link href="/login" className="btn-secondary">Manage listings</Link>
          </div>
        </div>
        <div className="relative rounded-[2.5rem] bg-ink p-8 text-white shadow-soft md:p-12">
          <div className="absolute -right-5 -top-5 rounded-2xl bg-lime p-4 text-ink"><Bot size={28}/></div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/60">Try asking</p>
          <p className="mt-5 text-3xl font-semibold leading-snug">“I need a sunny two-bedroom near downtown, under $2,000.”</p>
          <div className="mt-12 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4"><Building2 className="mb-3"/><b>Live listings</b><p className="mt-1 text-sm text-white/60">Always current</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><ShieldCheck className="mb-3"/><b>Real agents</b><p className="mt-1 text-sm text-white/60">Human follow-up</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
