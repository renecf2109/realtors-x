"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";

const publicLinks = [
  { href: "/investments", label: "Investments" },
  { href: "/projects", label: "Projects" },
  { href: "/chat", label: "Find a property" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-xl">
    <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
      <BrandLogo className="h-8 w-auto sm:h-9" priority/>
      <div className="hidden items-center gap-7 md:flex">
        {publicLinks.map(link => <Link key={link.href} href={link.href} className="text-sm font-semibold text-ink/65 transition hover:text-sage">{link.label}</Link>)}
        <Link href="/login" className="btn-secondary !px-4 !py-2">Agent portal</Link>
      </div>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"} className="rounded-full border border-ink/10 bg-white p-2.5 text-ink transition hover:border-sage hover:text-sage md:hidden">
        {open ? <X size={20}/> : <Menu size={20}/>}
      </button>
    </nav>
    {open && <div id="mobile-navigation" className="border-t border-ink/10 bg-white px-4 py-4 shadow-soft md:hidden">
      <div className="mx-auto max-w-7xl space-y-1">{publicLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-lime hover:text-sage">{link.label}</Link>)}<Link href="/login" onClick={() => setOpen(false)} className="btn mt-3 w-full">Agent portal</Link></div>
    </div>}
  </header>;
}
