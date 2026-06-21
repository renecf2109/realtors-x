import Link from "next/link";
import { Film, ImageIcon, ShieldCheck } from "lucide-react";
import { DashboardNav } from "@/components/DashboardNav";
import { requireAdmin } from "@/lib/admin";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ count: total }, { count: active }] = await Promise.all([
    supabase.from("featured_media").select("*", { count: "exact", head: true }),
    supabase.from("featured_media").select("*", { count: "exact", head: true }).eq("is_active", true)
  ]);
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin/><section><p className="eyebrow">Secure workspace</p><h1 className="mt-2 text-4xl font-black tracking-tight">Realtors X admin</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Control featured website media. Database policies independently verify every admin write.</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat icon={<ShieldCheck/>} label="Access" value="Admin"/><Stat icon={<Film/>} label="Media items" value={String(total ?? 0)}/><Stat icon={<ImageIcon/>} label="Active" value={String(active ?? 0)}/></div><Link href="/admin/featured-media" className="card group mt-6 block p-7 transition hover:-translate-y-1 hover:border-sage/40"><p className="eyebrow">Media management</p><h2 className="mt-3 text-2xl font-black">Featured images and videos</h2><p className="mt-2 max-w-2xl leading-7 text-ink/55">Add, preview, schedule, place, reorder, activate, edit, and remove website media.</p><span className="mt-5 inline-block text-sm font-bold text-sage">Open featured media →</span></Link></section></main>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="card p-5"><span className="text-sage">{icon}</span><p className="mt-4 text-sm text-ink/50">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }
