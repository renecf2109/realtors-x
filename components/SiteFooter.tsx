import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function SiteFooter() {
  return <footer className="mt-20 border-t border-ink/10 bg-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1fr_auto_auto]">
      <div><BrandLogo className="h-auto w-40"/><p className="mt-4 max-w-sm text-sm leading-6 text-ink/50">AI-powered property matching, curated projects, and human real estate expertise.</p></div>
      <div><p className="text-xs font-bold uppercase tracking-widest text-ink/40">Explore</p><div className="mt-4 space-y-3 text-sm font-semibold"><Link className="block hover:text-sage" href="/chat">Find a property</Link><Link className="block hover:text-sage" href="/projects">Projects</Link><Link className="block hover:text-sage" href="/investments">Investments</Link></div></div>
      <div><p className="text-xs font-bold uppercase tracking-widest text-ink/40">Agents</p><div className="mt-4 space-y-3 text-sm font-semibold"><Link className="block hover:text-sage" href="/login">Sign in</Link><Link className="block hover:text-sage" href="/signup">Create account</Link></div></div>
    </div>
    <div className="border-t border-ink/10 px-6 py-5 text-center text-xs text-ink/40">© {new Date().getFullYear()} Realtors X. Property intelligence, made personal.</div>
  </footer>;
}
