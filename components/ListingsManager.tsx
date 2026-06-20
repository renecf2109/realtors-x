"use client";

import Image from "next/image";
import { useState } from "react";
import { FileSpreadsheet, Images, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { missingFields, parseListingDescription, parseSpreadsheetRow, type ListingDraft } from "@/lib/listingParser";
import type { Property, PropertyInput } from "@/lib/types";

const blankDraft: ListingDraft = { description: "", features: [], images: [], availability: "available" };

export function ListingsManager({ initialProperties }: { initialProperties: Property[] }) {
  const [items, setItems] = useState(initialProperties.map(item => ({ ...item, images: item.images ?? [], project_name: item.project_name ?? null, investment_opportunity: item.investment_opportunity ?? false, expected_roi: item.expected_roi ?? null, completion_date: item.completion_date ?? null })));
  const [editing, setEditing] = useState<Property | null>(null);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  function showCreate() { setEditing(null); setOpen(true); }

  async function remove(id: string) {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (!error) setItems(value => value.filter(item => item.id !== id));
  }

  async function uploadGallery(propertyId: string, existing: string[], files: File[]) {
    if (!files.length) return existing;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in again.");
    const urls = [...existing];
    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `${user.id}/${propertyId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
      if (error) throw error;
      urls.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function save(input: PropertyInput, files: File[]) {
    try {
      if (editing) {
        const images = await uploadGallery(editing.id, input.images ?? [], files);
        const { data, error } = await supabase.from("properties").update({ ...input, images }).eq("id", editing.id).select().single();
        if (error) throw error;
        setItems(value => value.map(item => item.id === editing.id ? data as Property : item));
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in again.");
        const { data, error } = await supabase.from("properties").insert({ ...input, images: input.images ?? [], agent_id: user.id }).select().single();
        if (error) throw error;
        const images = await uploadGallery(data.id, input.images ?? [], files);
        let completed = data as Property;
        if (images.length !== (input.images ?? []).length) {
          const result = await supabase.from("properties").update({ images }).eq("id", data.id).select().single();
          if (result.error) throw result.error;
          completed = result.data as Property;
        }
        setItems(value => [completed, ...value]);
      }
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "The listing could not be saved." };
    }
  }

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-sage">AI inventory</p><h1 className="mt-1 text-4xl font-black">Property listings</h1></div>
      <button className="btn gap-2" onClick={showCreate}><Sparkles size={17}/> Create with AI</button>
    </div>
    <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(property => <article key={property.id} className="card overflow-hidden">
      {property.images?.[0] && <div className="relative aspect-[16/9] bg-cream"><Image src={property.images[0]} alt={`${property.title} gallery image`} fill unoptimized className="object-cover"/></div>}
      <div className="p-6"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-lime px-3 py-1 text-xs font-bold capitalize text-sage">{property.availability}</span><h2 className="mt-4 text-xl font-bold">{property.title}</h2><p className="mt-1 text-sm text-ink/50">{property.location}</p></div><p className="text-lg font-black">${Number(property.price).toLocaleString()}</p></div>
      {(property.project_name || property.investment_opportunity) && <div className="mt-4 flex flex-wrap gap-2">{property.project_name && <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{property.project_name}</span>}{property.investment_opportunity && <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-white">Investment{property.expected_roi ? ` · ${property.expected_roi}% ROI` : ""}</span>}</div>}
      <p className="mt-5 text-sm text-ink/60">{property.bedrooms} bd · {property.bathrooms} ba · {Number(property.size).toLocaleString()} sq ft · <span className="capitalize">{property.type}</span></p>
      {property.features.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{property.features.slice(0, 5).map(feature => <span key={feature} className="rounded-full bg-cream px-3 py-1 text-xs">{feature}</span>)}</div>}
      {property.images?.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-ink/45"><Images size={14}/>{property.images.length} gallery photo{property.images.length === 1 ? "" : "s"}</p>}
      <div className="mt-5 flex gap-2 border-t border-ink/10 pt-4"><button onClick={() => { setEditing(property); setOpen(true); }} className="btn-secondary gap-2 !px-4 !py-2"><Pencil size={14}/> Edit</button><button onClick={() => remove(property.id)} className="btn-secondary gap-2 !px-4 !py-2 text-red-600"><Trash2 size={14}/> Delete</button></div></div>
    </article>)}</div>
    {items.length === 0 && <div className="card mt-8 p-12 text-center"><Sparkles className="mx-auto text-sage"/><p className="mt-4 font-bold">Describe a property or import a spreadsheet.</p><p className="mt-1 text-sm text-ink/50">Realtors X will build the listing and ask only for what is missing.</p></div>}
    {open && <AIListingModal property={editing} onClose={() => setOpen(false)} onSave={save}/>} 
  </section>;
}

function AIListingModal({ property, onClose, onSave }: { property: Property | null; onClose: () => void; onSave: (input: PropertyInput, files: File[]) => Promise<{ ok: true } | { ok: false; message: string }> }) {
  const initialDraft: ListingDraft = property ? { ...property, images: property.images ?? [] } : blankDraft;
  const [step, setStep] = useState<"start" | "review">(property ? "review" : "start");
  const [description, setDescription] = useState(property?.description ?? "");
  const [draft, setDraft] = useState<ListingDraft>(initialDraft);
  const [queue, setQueue] = useState<ListingDraft[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const missing = missingFields(draft);

  async function analyze() {
    if (!description.trim()) { setError("Paste the property description first."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/listings/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDraft(result.draft); setStep("review");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The description could not be analyzed."); }
    finally { setBusy(false); }
  }

  async function importFile(file: File) {
    setBusy(true); setError("");
    try {
      let drafts: ListingDraft[] = [];
      if (file.name.toLowerCase().endsWith(".txt")) drafts = [parseListingDescription(await file.text())];
      else if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(await file.text());
        drafts = (Array.isArray(parsed) ? parsed : [parsed]).map(parseSpreadsheetRow);
      } else {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
        drafts = rows.map(parseSpreadsheetRow);
      }
      if (!drafts.length) throw new Error("No property rows were found in that file.");
      setQueue(drafts); setDraft(drafts[0]); setStep("review");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "That file could not be read."); }
    finally { setBusy(false); }
  }

  function update<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) { setDraft(current => ({ ...current, [key]: value })); }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (missing.length) { setError(`I still need: ${missing.join(", ")}.`); return; }
    setBusy(true); setError("");
    const result = await onSave(draft as PropertyInput, files);
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    if (queue.length > 1) {
      const remaining = queue.slice(1); setQueue(remaining); setDraft(remaining[0]); setFiles([]);
    } else onClose();
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-3 backdrop-blur-sm sm:p-5">
    <div className="mx-auto my-3 max-w-4xl rounded-3xl bg-cream p-5 shadow-soft sm:p-8">
      <div className="flex justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-semibold text-sage"><Sparkles size={16}/> Realtors X AI Listing Studio</p><h2 className="mt-1 text-2xl font-black">{property ? "Improve this listing" : step === "start" ? "How would you like to add it?" : "Review before publishing"}</h2></div><button onClick={onClose} aria-label="Close"><X/></button></div>
      {step === "start" ? <div className="mt-7 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-sage/25 bg-white p-6"><Sparkles className="text-sage"/><h3 className="mt-4 text-xl font-bold">Describe one property</h3><p className="mt-2 text-sm leading-6 text-ink/55">Paste everything you know in any order. AI extracts the listing and asks for missing details.</p><textarea className="field mt-5 min-h-44" value={description} onChange={event => setDescription(event.target.value)} placeholder="Beautiful 2-bedroom apartment in Hamra for $1,800, 1,200 sq ft, with parking and balcony…"/><button className="btn mt-4 w-full gap-2" onClick={analyze} disabled={busy}><Sparkles size={16}/> {busy ? "Analyzing…" : "Build my listing"}</button></div>
        <label className="cursor-pointer rounded-3xl border border-dashed border-ink/20 bg-white p-6 transition hover:border-sage"><FileSpreadsheet className="text-sage"/><h3 className="mt-4 text-xl font-bold">Import a file</h3><p className="mt-2 text-sm leading-6 text-ink/55">Upload Excel, CSV, JSON, or text. Every row becomes a listing review.</p><div className="mt-8 rounded-2xl bg-lime p-5 text-center text-sm font-bold text-sage"><Upload className="mx-auto mb-2"/>Choose a file</div><input type="file" accept=".xlsx,.xls,.csv,.json,.txt" className="hidden" onChange={event => event.target.files?.[0] && importFile(event.target.files[0])}/></label>
      </div> : <form onSubmit={publish} className="mt-7">
        {queue.length > 0 && <p className="mb-4 rounded-2xl bg-lime p-4 text-sm font-semibold text-sage">Spreadsheet listing {queue.length === 1 ? "final item" : `— ${queue.length} items remaining`}</p>}
        {missing.length > 0 ? <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><b>I found most of it. Please tell me:</b> {missing.join(", ")}.</div> : <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-sage"><b>Ready to publish.</b> Review the AI-extracted information below.</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" missing={!draft.title}><input className="field" value={draft.title ?? ""} onChange={e => update("title", e.target.value)}/></Field>
          <Field label="Price" missing={!draft.price}><input className="field" type="number" min="0" value={draft.price ?? ""} onChange={e => update("price", Number(e.target.value))}/></Field>
          <Field label="Location" missing={!draft.location}><input className="field" value={draft.location ?? ""} onChange={e => update("location", e.target.value)}/></Field>
          <Field label="Property type" missing={!draft.type}><select className="field" value={draft.type ?? ""} onChange={e => update("type", e.target.value)}><option value="">Choose type</option>{["apartment","house","villa","townhouse","studio","office","land"].map(type => <option key={type}>{type}</option>)}</select></Field>
          <Field label="Bedrooms" missing={draft.bedrooms === undefined}><input className="field" type="number" min="0" value={draft.bedrooms ?? ""} onChange={e => update("bedrooms", Number(e.target.value))}/></Field>
          <Field label="Bathrooms" missing={draft.bathrooms === undefined}><input className="field" type="number" min="0" step="0.5" value={draft.bathrooms ?? ""} onChange={e => update("bathrooms", Number(e.target.value))}/></Field>
          <Field label="Size (sq ft)" missing={!draft.size}><input className="field" type="number" min="0" value={draft.size ?? ""} onChange={e => update("size", Number(e.target.value))}/></Field>
          <Field label="Availability"><select className="field" value={draft.availability ?? "available"} onChange={e => update("availability", e.target.value as PropertyInput["availability"])}><option>available</option><option>reserved</option><option>sold</option><option>rented</option></select></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-28" value={draft.description} onChange={e => update("description", e.target.value)}/></Field></div>
          <div className="sm:col-span-2"><Field label="Features detected automatically"><input className="field" value={draft.features.join(", ")} onChange={e => update("features", e.target.value.split(",").map(value => value.trim()).filter(Boolean))} placeholder="parking, balcony, elevator"/></Field></div>
          <Field label="Project name (optional)"><input className="field" value={draft.project_name ?? ""} onChange={e => update("project_name", e.target.value || null)} placeholder="Realtors X Waterfront"/></Field>
          <Field label="Completion / handover (optional)"><input className="field" value={draft.completion_date ?? ""} onChange={e => update("completion_date", e.target.value || null)} placeholder="Q4 2027"/></Field>
          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-sage" checked={draft.investment_opportunity ?? false} onChange={e => update("investment_opportunity", e.target.checked)}/><span>Show on Investments page</span></label>
          <Field label="Expected ROI % (optional)"><input className="field" type="number" min="0" step="0.1" value={draft.expected_roi ?? ""} onChange={e => update("expected_roi", e.target.value ? Number(e.target.value) : null)}/></Field>
          <div className="sm:col-span-2"><label className="block rounded-2xl border border-dashed border-ink/20 bg-white p-5 text-sm font-semibold transition hover:border-sage"><span className="flex items-center gap-2"><Images size={18} className="text-sage"/>Property gallery</span><span className="mt-1 block text-xs font-normal text-ink/50">Choose multiple photos. Existing image URLs from spreadsheets are also kept.</span><input className="mt-4 block w-full text-sm" type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))}/></label>{((draft.images?.length ?? 0) + files.length) > 0 && <p className="mt-2 text-xs text-sage">{(draft.images?.length ?? 0) + files.length} gallery image(s) ready</p>}</div>
        </div>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-7 flex flex-wrap justify-end gap-3">{!property && <button type="button" className="btn-secondary" onClick={() => { setStep("start"); setQueue([]); setError(""); }}>Back</button>}<button className="btn gap-2" disabled={busy || missing.length > 0}><Plus size={16}/>{busy ? "Publishing…" : queue.length > 1 ? "Publish and review next" : "Publish listing"}</button></div>
      </form>}
      {step === "start" && error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {busy && step === "start" && <p className="mt-4 text-center text-sm text-sage">Reading your file…</p>}
    </div>
  </div>;
}

function Field({ label, missing = false, children }: { label: string; missing?: boolean; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold"><span className={missing ? "mb-2 block text-amber-700" : "mb-2 block"}>{label}{missing ? " — needed" : ""}</span>{children}</label>;
}
