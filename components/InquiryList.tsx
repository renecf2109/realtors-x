"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AIInquiry } from "@/lib/types";

export function InquiryList({ initialInquiries, admin = false }: { initialInquiries: AIInquiry[]; admin?: boolean }) {
  const [items, setItems] = useState(initialInquiries);
  const [message, setMessage] = useState("");
  async function updateStatus(id: string, status: AIInquiry["status"]) { const { data, error } = await createClient().from("ai_inquiries").update({ status }).eq("id", id).select().single(); if (error) setMessage(error.message); else { setItems(value => value.map(item => item.id === id ? data as AIInquiry : item)); setMessage("Inquiry updated."); } }
  return <section><p className="eyebrow">{admin ? "All AI requests" : "Assigned to you"}</p><h1 className="mt-2 text-4xl font-black">Inquiries</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Requests categorized by the Realtors X workbench for clear follow-up.</p><div aria-live="polite">{message ? <p className="mt-4 rounded-xl bg-lime p-3 text-sm text-sage">{message}</p> : null}</div>{items.length ? <div className="mt-8 space-y-4">{items.map(item => <article key={item.id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-sage">{item.category.replaceAll("_"," ")}</p><h2 className="mt-2 text-lg font-black">{item.subject}</h2><p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-ink/60">{item.details}</p></div><select aria-label={`Status for ${item.subject}`} className="field !w-auto capitalize" value={item.status} onChange={event => updateStatus(item.id, event.target.value as AIInquiry["status"])}><option value="new">New</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div><p className="mt-4 text-xs text-ink/40">{new Date(item.created_at).toLocaleString()}</p></article>)}</div> : <div className="card mt-8 p-12 text-center"><h2 className="text-xl font-black">No inquiries here</h2><p className="mt-2 text-sm text-ink/50">New categorized requests will appear automatically.</p></div>}</section>;
}
