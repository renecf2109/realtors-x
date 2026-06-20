"use client";

import Image from "next/image";
import Link from "next/link";
import { Bot, Check, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/types";

type Match = Property & { matchReasons: string[] };
type Message = { role: "user" | "assistant"; text: string; matches?: Match[] };
const suggestions = ["Sea-view apartments under $500k", "Available villas with a pool", "Investment opportunities with parking"];

export function ChatExperience() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Welcome to Realtors X. Tell me what you are looking for, including any area, budget, size, property type, or must-have features." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function runSearch(text: string) {
    if (!text.trim() || loading) return;
    const cleanText = text.trim();
    setMessages(value => [...value, { role: "user", text: cleanText }]); setInput(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: cleanText }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The search could not be completed.");
      setMessages(value => [...value, { role: "assistant", text: data.reply || "I could not find a close match yet. Try changing the area or budget.", matches: data.matches ?? [] }]);
    } catch (error) { setMessages(value => [...value, { role: "assistant", text: error instanceof Error ? error.message : "Something went wrong. Please try again." }]); }
    finally { setLoading(false); }
  }

  function send(e: React.FormEvent) { e.preventDefault(); void runSearch(input); }
  function toggle(id: string) { setSelectedIds(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]); }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section className="card flex min-h-[560px] flex-col overflow-hidden sm:min-h-[620px]">
      <div className="flex items-center gap-3 border-b border-ink/10 p-4 sm:p-5"><span className="rounded-full bg-lime p-2 text-sage"><Bot size={20}/></span><div><p className="font-bold">Realtors X Assistant</p><p className="flex items-center gap-1.5 text-xs text-sage"><span className="h-2 w-2 rounded-full bg-sage"/>Searching live listings</p></div></div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite" aria-busy={loading}>
        {messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-auto max-w-[88%] sm:max-w-[80%]" : "max-w-[98%]"}><div className={message.role === "user" ? "rounded-2xl rounded-br-sm bg-sage p-4 text-sm leading-6 text-white" : "rounded-2xl rounded-bl-sm bg-cream p-4 text-sm leading-6"}>{message.text}</div>{message.matches && message.matches.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{message.matches.map(property => <PropertyResult key={property.id} property={property} selected={selectedIds.includes(property.id)} onToggle={() => toggle(property.id)}/>)}</div>}</div>)}
        {loading && <div className="w-fit animate-pulse rounded-2xl bg-cream p-4 text-sm">Searching your options…</div>}
      </div>
      {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">{suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => void runSearch(suggestion)} className="rounded-full border border-sage/25 bg-lime/50 px-3 py-2 text-left text-xs font-semibold text-sage transition hover:bg-lime">{suggestion}</button>)}</div>}
      <form onSubmit={send} className="flex items-end gap-2 border-t border-ink/10 bg-white p-3 sm:gap-3 sm:p-4"><label className="sr-only" htmlFor="property-search">Describe the property you want</label><textarea id="property-search" rows={1} className="field min-h-12 flex-1 resize-none" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void runSearch(input); } }} placeholder="Describe your ideal property…" disabled={loading}/><button className="btn !min-h-12 !px-4" aria-label="Send property search" disabled={loading || !input.trim()}><Send size={18}/></button></form>
    </section>
    <aside className="space-y-4"><div className="rounded-3xl bg-ink p-6 text-white"><Sparkles className="text-[#46b4f5]"/><h2 className="mt-5 text-2xl font-bold">Want a human eye?</h2><p className="mt-2 text-sm leading-6 text-white/65">Select matching properties, then prepare an inquiry for the listing agent or admin on WhatsApp.</p><button onClick={() => setShowLead(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0874b7]"><MessageCircle size={17}/>{selectedIds.length ? `Request ${selectedIds.length} selected` : "Request a call"}</button></div><div className="card p-5 text-sm text-ink/55"><b className="text-ink">For stronger results</b><p className="mt-2 leading-6">Include budget, area, bedrooms, property type, size, and must-have features.</p></div></aside>
    {showLead && <LeadModal propertyIds={selectedIds} onClose={() => setShowLead(false)}/>} 
  </div>;
}

function PropertyResult({ property, selected, onToggle }: { property: Match; selected: boolean; onToggle: () => void }) {
  return <article className={`overflow-hidden rounded-2xl border bg-white ${selected ? "border-sage ring-2 ring-sage/20" : "border-ink/10"}`}>{property.images?.[0] && <div className="relative aspect-[16/9]"><Image src={property.images[0]} alt={`${property.title} property image`} fill unoptimized className="object-cover"/></div>}<div className="p-4"><div className="flex items-start justify-between gap-2"><span className="text-xs font-bold uppercase text-sage">{property.type}</span><b className="whitespace-nowrap">${Number(property.price).toLocaleString()}</b></div><h3 className="mt-2 font-bold">{property.title}</h3><p className="mt-1 text-xs leading-5 text-ink/50">{property.location} · {property.bedrooms} bd · {property.bathrooms} ba · {Number(property.size).toLocaleString()} sq ft</p>{property.matchReasons.length > 0 && <p className="mt-3 text-xs leading-5 text-sage">Matches: {property.matchReasons.join(", ")}</p>}<div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={onToggle} className={selected ? "flex-1 rounded-full bg-sage px-3 py-2 text-xs font-bold text-white" : "flex-1 rounded-full bg-lime px-3 py-2 text-xs font-bold text-sage"}>{selected ? <><Check className="mr-1 inline" size={13}/>Selected</> : "I’m interested"}</button><Link href={`/properties/${property.id}`} className="rounded-full border border-ink/10 px-3 py-2 text-center text-xs font-bold transition hover:border-sage hover:text-sage">View details</Link></div></div></article>;
}

function LeadModal({ propertyIds, onClose }: { propertyIds: string[]; onClose: () => void }) {
  const [done, setDone] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [whatsappUrl, setWhatsappUrl] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const data = { ...Object.fromEntries(new FormData(e.currentTarget)), property_ids: propertyIds };
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your request could not be saved.");
      setWhatsappUrl(result.whatsapp_url); setDone(true); window.open(result.whatsapp_url, "_blank", "noopener,noreferrer");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Your request could not be saved."); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="lead-title"><div className="mx-auto my-4 max-w-lg rounded-3xl bg-cream p-5 shadow-soft sm:my-8 sm:p-7">{done ? <div className="py-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime text-sage"><Check size={28}/></div><h2 id="lead-title" className="mt-5 text-2xl font-black">Inquiry saved</h2><p className="mt-2 leading-6 text-ink/55">Your WhatsApp message is ready. Press send in WhatsApp to deliver it.</p><a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn mt-6">Open WhatsApp message</a><button onClick={onClose} className="mt-4 block w-full text-sm font-bold text-ink/50 hover:text-sage">Back to search</button></div> : <form onSubmit={submit}><div className="flex justify-between gap-4"><div><p className="text-sm font-semibold text-sage">Agent follow-up</p><h2 id="lead-title" className="text-2xl font-black">Tell us about you</h2>{propertyIds.length > 0 && <p className="mt-1 text-xs text-sage">{propertyIds.length} selected listing{propertyIds.length === 1 ? "" : "s"}</p>}</div><button type="button" onClick={onClose} aria-label="Close inquiry form" className="h-10 rounded-full p-2 transition hover:bg-white"><X/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><LeadField label="Name"><input className="field" name="name" autoComplete="name" required/></LeadField><LeadField label="Phone"><input className="field" name="phone" type="tel" inputMode="tel" autoComplete="tel" required/></LeadField><LeadField label="Budget (USD)"><input className="field" name="budget" type="number" inputMode="numeric" min="0" required/></LeadField><LeadField label="Preferred area"><input className="field" name="preferred_area" autoComplete="address-level2" required/></LeadField><LeadField label="Property type"><select className="field" name="requested_property_type" required><option value="">Choose one</option><option>apartment</option><option>house</option><option>villa</option><option>townhouse</option><option>studio</option><option>office</option><option>land</option></select></LeadField><LeadField label="Move-in date"><input className="field" name="move_in_date" type="date"/></LeadField><div className="sm:col-span-2"><LeadField label="Message or question"><textarea className="field min-h-24" name="inquiry" placeholder="Anything the agent should know?"/></LeadField></div></div><div aria-live="polite">{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div><button className="btn mt-6 w-full" disabled={busy}>{busy ? "Preparing WhatsApp…" : "Continue to WhatsApp"}</button></form>}</div></div>;
}

function LeadField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>; }
