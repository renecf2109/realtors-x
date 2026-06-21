"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Search, ShieldCheck, FileSpreadsheet, Inbox } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { BrandLogo } from "./BrandLogo";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/listings", label: "Listings", icon: Building2 },
  { href: "/agent-search", label: "Inventory search", icon: Search },
  { href: "/dashboard/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/dashboard/imports", label: "Imports", icon: FileSpreadsheet }
];

export function DashboardNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visibleLinks = isAdmin ? [...links, { href: "/admin", label: "Admin", icon: ShieldCheck }] : links;
  return <aside className="rounded-3xl bg-ink p-3 text-white sm:p-4 lg:min-h-[calc(100vh-9rem)] lg:p-5">
    <div className="flex items-center justify-between gap-4 lg:block">
      <div className="rounded-2xl bg-white px-3 py-2.5"><BrandLogo className="h-auto w-28 sm:w-36"/></div>
      <div className="lg:hidden"><LogoutButton/></div>
    </div>
    <p className="mt-5 hidden px-3 text-xs font-bold uppercase tracking-[.18em] text-white/45 lg:block">Agent workspace</p>
    <nav aria-label="Agent workspace" className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
      {visibleLinks.map(link => { const Icon = link.icon; const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`)); return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 min-w-24 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-[10px] font-semibold transition sm:text-xs lg:min-h-0 lg:w-full lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left lg:text-sm ${active ? "bg-sage text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon size={18}/><span>{link.label}</span></Link>; })}
    </nav>
    <div className="mt-10 hidden border-t border-white/10 px-3 pt-5 lg:block"><LogoutButton/></div>
  </aside>;
}
