"use client";

import Image from "next/image";
import Link from "next/link";
import { Bot, Check, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/types";

type Match = Property & { matchReasons: string[] };
type Message = { role: "user" | "assistant"; text: string; matches?: Match[] };

export function ChatExperience() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hi! Tell me what kind of property you’re looking for. For example: “A 2-bedroom apartment in Hamra under $1,500 with parking.”" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!input.trim() || loading) return;
    const text = input.trim(); setMessages(value => [...value, { role: "user", text }]); setInput(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data = await response.json();
      setMessages(value => [...value, { role: "assistant", text: data.reply || data.error, matches: data.matches }]);
    } catch { setMessages(value => [...value, { role: "assistant", text: "Something went wrong. Please try again." }]); }
    finally { setLoading(false); }
  }

  function toggle(id: string) { setSelectedIds(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]); }

  return <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
    <section className="card flex min-h-[580px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-ink/10 p-5"><span className="rounded-full bg-lime p-2 text-sage"><Bot size={20}/></span><div><p className="font-bold">Realtors X Assistant</p><p className="text-xs text-sage">Searching live listings</p></div></div>
      <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-7">{messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-auto max-w-[80%]" : "max-w-[95%]"}><div className={message.role === "user" ? "rounded-2xl rounded-br-sm bg-sage p-4 text-sm text-white" : "rounded-2xl rounded-bl-sm bg-cream p-4 text-sm"}>{message.text}</div>{message.matches && <div className="mt-4 grid gap-3 sm:grid-cols-2">{message.matches.map(property => <PropertyResult key={property.id} property={property} selected={selectedIds.includes(property.id)} onToggle={() => toggle(property.id)}/>)}</div>}</div>)}{loading && <div className="w-fit animate-pulse rounded-2xl bg-cream p-4 text-sm">Searching your options…</div>}</div>
      <form onSubmit={send} className="flex gap-3 border-t border-ink/10 p-4"><input className="field flex-1" value={input} onChange={e => setInput(e.target.value)} placeholder="A 3-bedroom house near…"/><button className="btn !px-4" aria-label="Send" disabled={loading}><Send size={18}/></button></form>
    </section>
    <aside className="space-y-4"><div className="rounded-3xl bg-ink p-6 text-white"><Sparkles className="text-sage"/><h2 className="mt-5 text-2xl font-bold">Want a human eye?</h2><p className="mt-2 text-sm leading-6 text-white/70">Select matching properties, then send your inquiry directly to the listing agent or admin on WhatsApp.</p><button onClick={() => setShowLead(true)} className="mt-5 w-full rounded-full bg-sage px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0874b7]">{selectedIds.length ? `Request ${selectedIds.length} selected` : "Request a call"}</button></div><div className="card p-5 text-sm text-ink/55"><b className="text-ink">Search tips</b><p className="mt-2 leading-6">Include budget, area, bedrooms, property type, size, and features.</p></div></aside>
    {showLead && <LeadModal propertyIds={selectedIds} onClose={() => setShowLead(false)}/>} 
  </div>;
}

function PropertyResult({ property, selected, onToggle }: { property: Match; selected: boolean; onToggle: () => void }) {
  return <article className={`overflow-hidden rounded-2xl border bg-white ${selected ? "border-sage ring-2 ring-sage/20" : "border-ink/10"}`}>{property.images?.[0] && <div className="relative aspect-[16/9]"><Image src={property.images[0]} alt={`${property.title} property image`} fill unoptimized className="object-cover"/></div>}<div className="p-4"><div className="flex justify-between gap-2"><span className="text-xs font-bold uppercase text-sage">{property.type}</span><b>${Number(property.price).toLocaleString()}</b></div><h3 className="mt-2 font-bold">{property.title}</h3><p className="mt-1 text-xs text-ink/50">{property.location} · {property.bedrooms} bd · {property.bathrooms} ba · {Number(property.size).toLocaleString()} sq ft</p>{property.matchReasons.length > 0 && <p className="mt-3 text-xs text-sage">Matches: {property.matchReasons.join(", ")}</p>}<div className="mt-4 flex gap-2"><button onClick={onToggle} className={selected ? "flex-1 rounded-full bg-sage px-3 py-2 text-xs font-bold text-white" : "flex-1 rounded-full bg-lime px-3 py-2 text-xs font-bold text-sage"}>{selected ? <><Check className="mr-1 inline" size={13}/>Selected</> : "I’m interested"}</button><Link href={`/properties/${property.id}`} className="rounded-full border border-ink/10 px-3 py-2 text-xs font-bold">View</Link></div></div></article>;
}

function LeadModal({ propertyIds, onClose }: { propertyIds: string[]; onClose: () => void }) {
  const [done, setDone] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [whatsappUrl, setWhatsappUrl] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const data = { ...Object.fromEntries(new FormData(e.currentTarget)), property_ids: propertyIds };
    const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json(); setBusy(false);
    if (response.ok) { setWhatsappUrl(result.whatsapp_url); setDone(true); window.open(result.whatsapp_url, "_blank", "noopener,noreferrer"); }
    else setError(result.error);
  }
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm"><div className="mx-auto my-8 max-w-lg rounded-3xl bg-cream p-7">{done ? <div className="py-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime text-2xl text-sage">✓</div><h2 className="mt-5 text-2xl font-black">Lead saved</h2><p className="mt-2 text-ink/55">The WhatsApp message is ready. Press send in WhatsApp to deliver it.</p><a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn mt-6">Open WhatsApp message</a><button onClick={onClose} className="mt-4 block w-full text-sm font-bold text-ink/50">Back to search</button></div> : <form onSubmit={submit}><div className="flex justify-between"><div><p className="text-sm font-semibold text-sage">Agent follow-up</p><h2 className="text-2xl font-black">Tell us about you</h2>{propertyIds.length > 0 && <p className="mt-1 text-xs text-sage">{propertyIds.length} selected listing{propertyIds.length === 1 ? "" : "s"}</p>}</div><button type="button" onClick={onClose}>✕</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><LeadField label="Name"><input className="field" name="name" required/></LeadField><LeadField label="Phone"><input className="field" name="phone" type="tel" required/></LeadField><LeadField label="Budget"><input className="field" name="budget" type="number" min="0" required/></LeadField><LeadField label="Preferred area"><input className="field" name="preferred_area" required/></LeadField><LeadField label="Property type"><select className="field" name="requested_property_type" required><option value="">Choose one</option><option>apartment</option><option>house</option><option>villa</option><option>townhouse</option><option>studio</option><option>office</option><option>land</option></select></LeadField><LeadField label="Move-in date"><input className="field" name="move_in_date" type="date"/></LeadField><div className="sm:col-span-2"><LeadField label="Message or question"><textarea className="field min-h-24" name="inquiry" placeholder="Anything the agent should know?"/></LeadField></div></div>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<button className="btn mt-6 w-full" disabled={busy}>{busy ? "Preparing WhatsApp…" : "Continue to WhatsApp"}</button></form>}</div></div>;
}

function LeadField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>; }
