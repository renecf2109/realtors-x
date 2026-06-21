import Link from "next/link";
import { ArrowRight, CheckCircle2, FolderKanban, Sparkles, TrendingUp } from "lucide-react";
import { FeaturedMediaAsset } from "@/components/FeaturedMediaAsset";
import { FeaturedMediaStrip } from "@/components/FeaturedMediaStrip";
import { getActiveFeaturedMedia } from "@/lib/featuredMediaServer";

const steps = [
  ["Describe", "Tell the assistant where, how, and when you want to live."],
  ["Discover", "Realtors X compares your request with live property inventory."],
  ["Connect", "Shortlist the right options and continue with a real agent."]
];

export default async function Home() {
  const featuredMedia = await getActiveFeaturedMedia(["homepage_hero", "homepage_strip"]);
  const heroMedia = featuredMedia.find(item => item.placement === "homepage_hero");
  const stripMedia = featuredMedia.filter(item => item.placement === "homepage_strip");
  const logoPreview = heroMedia?.media_url.endsWith("/logo.png");

  return <main>
    <section className="relative flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-ink text-white">
      {heroMedia ? <div className="absolute inset-0 bg-white"><FeaturedMediaAsset item={heroMedia} background priority fit={logoPreview ? "contain" : "cover"} className={logoPreview ? "bg-white p-8 sm:p-16 lg:p-24" : ""}/></div> : <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#081d2b] to-sage"/>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"/>
      <div className="relative z-10 w-full border-t border-white/20 bg-black/30 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-12 lg:py-14">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-black leading-[.95] tracking-[-.045em] sm:text-6xl lg:text-7xl">The right property, without the noise.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">{heroMedia?.description || "Describe what matters in your own words. Realtors X searches current listings, explains the strongest matches, and connects you with an agent."}</p>
          </div>
          <div className="mt-7 inline-flex w-full flex-col gap-2 rounded-[1.75rem] border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-xl sm:w-auto sm:flex-row sm:rounded-full">
            <Link href="/chat" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-lime">Start your property search <ArrowRight size={17}/></Link>
            <Link href="/projects" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-black/15 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20">Explore projects</Link>
            <Link href="/investments" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-black/15 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20">View investments</Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/75 backdrop-blur-lg sm:w-fit sm:rounded-full">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#54baff]"/>Natural-language search</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#54baff]"/>Direct agent follow-up</span>
          </div>
        </div>
      </div>
    </section>

    <FeaturedMediaStrip items={stripMedia} title="Featured properties and projects" billboard/>

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
