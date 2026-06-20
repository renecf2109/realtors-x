import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Bot, Building2, CheckCircle2, FolderKanban, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const steps = [
  ["Describe", "Tell the assistant where, how, and when you want to live."],
  ["Discover", "Realtors X compares your request with live property inventory."],
  ["Connect", "Shortlist the right options and continue with a real agent."]
];

export default function Home() {
  return <main>
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-ink lg:block" aria-hidden="true"/>
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <BrandLogo className="mb-8 h-auto w-44 sm:w-56"/>
          <p className="eyebrow">AI-powered property matching</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[.96] tracking-[-.045em] sm:text-6xl lg:text-7xl">The right property, without the noise.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/60">Describe what matters in your own words. Realtors X searches current listings, explains the strongest matches, and connects you with an agent.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/chat" className="btn gap-2">Start your property search <ArrowRight size={17}/></Link>
            <Link href="/projects" className="btn-secondary">Explore projects</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/55">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-sage"/>Natural-language search</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-sage"/>Direct agent follow-up</span>
          </div>
        </div>
        <div className="relative rounded-[2.25rem] bg-ink p-7 text-white shadow-soft sm:p-10 lg:p-12">
          <div className="absolute -right-3 -top-3 rounded-2xl bg-sage p-4 text-white sm:-right-5 sm:-top-5"><Bot size={28}/></div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-white/50">Try asking</p>
          <p className="mt-5 text-2xl font-semibold leading-snug sm:text-3xl">“I need a modern sea-view apartment in Beirut under $450,000, with parking and a balcony.”</p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><Building2 className="mb-3 text-[#46b4f5]"/><b>Live inventory</b><p className="mt-1 text-sm text-white/55">Current availability</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="mb-3 text-[#46b4f5]"/><b>Trusted follow-up</b><p className="mt-1 text-sm text-white/55">Real local agents</p></div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
      <div className="max-w-2xl"><p className="eyebrow">One search, three paths</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Explore the market your way.</h2></div>
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        <ExploreCard href="/chat" icon={<Sparkles/>} title="AI property search" text="Ask for any combination of location, budget, size, type, and features." cta="Ask Realtors X"/>
        <ExploreCard href="/projects" icon={<FolderKanban/>} title="Projects" text="Compare available units grouped by development and handover timeline." cta="View projects"/>
        <ExploreCard href="/investments" icon={<TrendingUp/>} title="Investments" text="Browse opportunities with available return and project information." cta="View investments"/>
      </div>
    </section>

    <section className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#46b4f5]">How it works</p>
        <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">A calmer way to find property.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">{steps.map(([title, text], index) => <div key={title} className="border-t border-white/15 pt-6"><span className="text-sm font-bold text-[#46b4f5]">0{index + 1}</span><h3 className="mt-4 text-2xl font-bold">{title}</h3><p className="mt-2 leading-7 text-white/60">{text}</p></div>)}</div>
      </div>
    </section>
  </main>;
}

function ExploreCard({ href, icon, title, text, cta }: { href: string; icon: React.ReactNode; title: string; text: string; cta: string }) {
  return <Link href={href} className="card group p-7 transition duration-300 hover:-translate-y-1 hover:border-sage/40 hover:shadow-soft"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime text-sage">{icon}</span><h3 className="mt-7 text-2xl font-black">{title}</h3><p className="mt-3 min-h-20 leading-7 text-ink/55">{text}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sage">{cta}<ArrowRight size={16} className="transition group-hover:translate-x-1"/></span></Link>;
}
