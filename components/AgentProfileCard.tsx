"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgentProfile } from "@/lib/types";

export function AgentProfileCard({ profile }: { profile: AgentProfile | null }) {
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.whatsapp_phone ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!profile) return; setBusy(true); setMessage("");
    const { error } = await createClient().from("profiles").update({ full_name: name.trim() || null, whatsapp_phone: phone.trim() || null }).eq("id", profile.id);
    setBusy(false); setMessage(error ? error.message : "WhatsApp routing profile saved.");
  }
  return <div className="card mt-6 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-sage">{profile?.role ?? "agent"} profile</p><h2 className="mt-1 text-xl font-bold">WhatsApp lead routing</h2><p className="mt-1 text-sm text-ink/50">Use international format, including country code. Example: +961...</p></div><button onClick={save} className="btn gap-2 !py-2" disabled={busy || !profile}><Save size={15}/>{busy ? "Saving…" : "Save profile"}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Display name<input className="field mt-2" value={name} onChange={e => setName(e.target.value)} placeholder="Agent name"/></label><label className="text-sm font-semibold">WhatsApp number<input className="field mt-2" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+961..."/></label></div>{message && <p className="mt-3 text-sm text-sage">{message}</p>}</div>;
}
