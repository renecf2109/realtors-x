"use client";

import Link from "next/link";
import { CheckSquare, MessageCircle, Search, Square } from "lucide-react";
import { useState } from "react";
import type { Property } from "@/lib/types";

export function AgentInventorySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Property[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [reply, setReply] = useState("Ask for any combination of area, type, price, size, rooms, features, or status.");
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault(); if (!query.trim()) return;
    setBusy(true); setSelected([]);
    const response = await fetch("/api/agent/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: query }) });
    const data = await response.json();
    setBusy(false); setReply(data.reply ?? data.error); setResults(data.matches ?? []);
  }

  function toggle(id: string) { setSelected(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]); }

  function sendSelected() {
    const chosen = results.filter(property => selected.includes(property.id));
    const lines = chosen.map(property => `• ${property.title} — $${Number(property.price).toLocaleString()} — ${window.location.origin}/properties/${property.id}`);
    const message = `Realtors X property options:\n\n${lines.join("\n")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <section>
    <p className="text-sm font-semibold text-sage">Private agent tool</p><h1 className="mt-1 text-4xl font-black">Search all inventory</h1>
    <div className="card mt-8 overflow-hidden"><div className="bg-ink p-6 text-white"><p className="text-sm text-white/55">Example</p><p className="mt-2 text-lg font-semibold">“Available sea-view apartments or villas in Medyar, under $500k, above 1,500 sq ft.”</p></div>
      <form onSubmit={search} className="flex gap-3 p-5"><input className="field flex-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Describe exactly what your client needs…"/><button className="btn gap-2" disabled={busy}><Search size={17}/>{busy ? "Searching…" : "Search"}</button></form>
      <p className="border-t border-ink/10 px-5 py-4 text-sm text-ink/55">{reply}</p></div>
    {selected.length > 0 && <div className="sticky top-4 z-10 mt-5 flex items-center justify-between rounded-2xl bg-sage p-4 text-white shadow-soft"><b>{selected.length} selected</b><button onClick={sendSelected} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-sage"><MessageCircle className="mr-2 inline" size={16}/>Send by WhatsApp</button></div>}
    <div className="mt-6 grid gap-4 md:grid-cols-2">{results.map(property => { const isSelected = selected.includes(property.id); return <article key={property.id} className={`card p-5 transition ${isSelected ? "ring-2 ring-sage" : ""}`}><button onClick={() => toggle(property.id)} className="flex w-full items-start gap-3 text-left">{isSelected ? <CheckSquare className="mt-1 shrink-0 text-sage"/> : <Square className="mt-1 shrink-0 text-ink/25"/>}<span className="flex-1"><span className="flex justify-between gap-3"><b className="text-lg">{property.title}</b><b>${Number(property.price).toLocaleString()}</b></span><span className="mt-1 block text-sm text-ink/50">{property.location} · {property.type} · {property.bedrooms} bd · {Number(property.size).toLocaleString()} sq ft</span>{property.features.length > 0 && <span className="mt-3 block text-xs text-sage">{property.features.join(" · ")}</span>}<span className="mt-3 block rounded-xl bg-cream p-3 text-xs"><b>Developer:</b> {property.developer_name || "Not provided"} · <b>Status:</b> {property.availability}</span></span></button><Link href={`/properties/${property.id}`} className="mt-4 inline-block text-xs font-bold text-sage hover:underline">Open client-safe page →</Link></article>; })}</div>
  </section>;
}
