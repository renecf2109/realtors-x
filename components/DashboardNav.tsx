import Link from "next/link";
import { LayoutDashboard, Building2, Search } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { BrandLogo } from "./BrandLogo";

export function DashboardNav() {
  return <aside className="rounded-3xl bg-ink p-5 text-white lg:min-h-[calc(100vh-9rem)]">
    <div className="rounded-2xl bg-white px-3 py-3"><BrandLogo className="h-auto w-full max-w-40"/></div>
    <p className="mt-5 px-3 text-xs font-bold uppercase tracking-[.18em] text-white/45">Agent workspace</p>
    <nav className="mt-7 space-y-2">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/10"><LayoutDashboard size={18}/> Dashboard</Link>
      <Link href="/listings" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/10"><Building2 size={18}/> Listings</Link>
      <Link href="/agent-search" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/10"><Search size={18}/> Inventory search</Link>
    </nav>
    <div className="mt-10 border-t border-white/10 px-3 pt-5"><LogoutButton/></div>
  </aside>;
}
