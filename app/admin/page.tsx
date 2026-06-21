import Link from "next/link";
import { Film, ImageIcon, ShieldCheck, FileSpreadsheet, Inbox } from "lucide-react";
import { DashboardNav } from "@/components/DashboardNav";
import { requireAdmin } from "@/lib/admin";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ count: total }, { count: active }] = await Promise.all([
    supabase.from("featured_media").select("*", { count: "exact", head: true }),
    supabase.from("featured_media").select("*", { count: "exact", head: true }).eq("is_active", true)
  ]);
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin/><section><p className="eyebrow">Secure workspace</p><h1 className="mt-2 text-4xl font-black tracking-tight">Realtors X admin</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Control the AI workbench, inquiries, imports, and featured media. Database policies independently verify every admin action.</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat icon={<ShieldCheck/>} label="Access" value="Admin"/><Stat icon={<Film/>} label="Media items" value={String(total ?? 0)}/><Stat icon={<ImageIcon/>} label="Active" value={String(active ?? 0)}/></div><div className="mt-6 grid gap-4 md:grid-cols-3"><AdminLink href="/admin/inquiries" icon={<Inbox/>} title="AI inquiries" text="Review every categorized lead and workbench request."/><AdminLink href="/admin/imports" icon={<FileSpreadsheet/>} title="Listing imports" text="Monitor CSV and Excel imports from every agent."/><AdminLink href="/admin/featured-media" icon={<Film/>} title="Featured media" text="Manage website campaigns, images, and videos."/></div></section></main>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="card p-5"><span className="text-sage">{icon}</span><p className="mt-4 text-sm text-ink/50">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>; }
function AdminLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) { return <Link href={href} className="card group p-6 transition hover:-translate-y-1 hover:border-sage/40"><span className="text-sage">{icon}</span><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-ink/55">{text}</p><span className="mt-4 inline-block text-sm font-bold text-sage">Open →</span></Link>; }
