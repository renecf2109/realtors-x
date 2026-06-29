"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Images, LinkIcon, Save, Sparkles, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ListingDraft } from "@/lib/listingParser";
import type { PropertyInput } from "@/lib/types";
import { formatListingPrice } from "@/lib/listingPrice";

const blankDraft: ListingDraft = { title: "", price: undefined, price_status: "price_on_request", location: "", type: "property", bedrooms: 0, bathrooms: 0, size: 0, description: "", features: [], images: [], availability: "available" };

export function PasteListingCreator({ userId }: { userId: string }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ListingDraft>(blankDraft);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: string; title: string; price: number | null; price_status: string | null; location: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const listingPath = saved ? `/listings/${saved.id}` : "";
  const fullLink = typeof window !== "undefined" && listingPath ? `${window.location.origin}${listingPath}` : listingPath;

  async function analyze() {
    if (!text.trim()) { setError("Paste the listing text first."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/listings/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: text }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The listing could not be analyzed.");
      const parsed = result.draft as ListingDraft;
      setDraft({
        ...blankDraft,
        ...parsed,
        title: parsed.title || "",
        location: parsed.location || "",
        type: parsed.type || "property",
        price_status: parsed.price ? null : parsed.price_status ?? "price_on_request",
        bedrooms: parsed.bedrooms ?? 0,
        bathrooms: parsed.bathrooms ?? 0,
        size: parsed.size ?? 0,
        availability: parsed.availability ?? "available"
      });
      setSaved(null);
      setError(result.warning ?? "");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The listing could not be analyzed."); }
    finally { setBusy(false); }
  }

  function update<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) { setDraft(current => ({ ...current, [key]: value })); }
  function requiredMissing() {
    return [!draft.title && "title", !draft.location && "location/project", !draft.type && "property type", !draft.availability && "listing status"].filter(Boolean) as string[];
  }

  async function uploadPhotos(listingId: string, files: File[]) {
    const urls: string[] = [];
    for (const file of files) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `${userId}/${listingId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      urls.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  }

  async function save() {
    const missing = requiredMissing();
    if (missing.length) { setError(`I still need: ${missing.join(", ")}.`); return; }
    setBusy(true); setError("");
    try {
      const input: PropertyInput = {
        title: draft.title!,
        price: draft.price ?? null,
        price_status: draft.price ? null : draft.price_status ?? "price_on_request",
        location: draft.location!,
        bedrooms: draft.bedrooms ?? 0,
        bathrooms: draft.bathrooms ?? 0,
        size: draft.size ?? 0,
        type: draft.type || "property",
        description: draft.description || text,
        features: draft.features ?? [],
        images: draft.images ?? [],
        project_name: draft.project_name ?? null,
        investment_opportunity: draft.investment_opportunity ?? false,
        expected_roi: draft.expected_roi ?? null,
        completion_date: draft.completion_date ?? null,
        developer_name: draft.developer_name ?? null,
        show_developer_to_public: draft.show_developer_to_public ?? false,
        availability: draft.availability ?? "available"
      };
      const { data, error: insertError } = await supabase.from("listings").insert({ ...input, agent_id: userId }).select("id,title,price,price_status,location").single();
      if (insertError) throw insertError;
      const imageUrls = await uploadPhotos(data.id, photos);
      if (imageUrls.length) {
        const { error: updateError } = await supabase.from("listings").update({ images: [...(draft.images ?? []), ...imageUrls] }).eq("id", data.id);
        if (updateError) throw updateError;
        await supabase.from("listing_media").insert(imageUrls.map((url, index) => ({ listing_id: data.id, media_type: "image", media_url: url, sort_order: index })));
      }
      if (videoUrl.trim()) await supabase.from("listing_media").insert({ listing_id: data.id, media_type: "video", media_url: videoUrl.trim(), sort_order: imageUrls.length });
      setSaved(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The listing could not be saved."); }
    finally { setBusy(false); }
  }

  async function copy(value: string) { await navigator.clipboard.writeText(value); }

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">AI Listing Creator</p><h1 className="mt-2 text-4xl font-black">Paste one listing and publish it.</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Paste messy WhatsApp text, brochure text, or agent notes. Realtors X extracts the listing, lets you review it, uploads photos to Supabase Storage, and prepares a share link.</p></div><Link href="/dashboard/listings" className="btn-secondary">Back to listings</Link></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5"><div className="card p-6"><Sparkles className="text-sage"/><h2 className="mt-3 text-xl font-black">Paste messy listing text</h2><textarea className="field mt-4 min-h-52" value={text} onChange={event => setText(event.target.value)} placeholder="Project: Medyar&#10;Unit: A-1203&#10;2BR apartment, sea view, 1,280 sqft, price $250,000, available..."/><button onClick={analyze} className="btn mt-4 gap-2"><Sparkles size={16}/>Parse listing info</button></div>
      <div className="card p-6"><h2 className="text-xl font-black">Review before saving</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Title"><input className="field" value={draft.title ?? ""} onChange={e => update("title", e.target.value)}/></Field><Field label="Price"><input className="field" type="number" value={draft.price ?? ""} onChange={e => update("price", e.target.value ? Number(e.target.value) : undefined)}/></Field><Field label="Price status"><input className="field" value={draft.price_status ?? ""} onChange={e => update("price_status", e.target.value || null)}/></Field><Field label="Location / area"><input className="field" value={draft.location ?? ""} onChange={e => update("location", e.target.value)}/></Field><Field label="Property type"><input className="field" value={draft.type ?? ""} onChange={e => update("type", e.target.value)}/></Field><Field label="Status"><select className="field" value={draft.availability ?? "available"} onChange={e => update("availability", e.target.value as PropertyInput["availability"])}>{["available","under_construction","booked","reserved","sold","rented","draft","inactive","pending"].map(status => <option key={status}>{status}</option>)}</select></Field><Field label="Bedrooms"><input className="field" type="number" value={draft.bedrooms ?? 0} onChange={e => update("bedrooms", Number(e.target.value))}/></Field><Field label="Bathrooms"><input className="field" type="number" step="0.5" value={draft.bathrooms ?? 0} onChange={e => update("bathrooms", Number(e.target.value))}/></Field><Field label="Size"><input className="field" type="number" value={draft.size ?? 0} onChange={e => update("size", Number(e.target.value))}/></Field><Field label="Project"><input className="field" value={draft.project_name ?? ""} onChange={e => update("project_name", e.target.value || null)}/></Field><div className="sm:col-span-2"><Field label="Features"><input className="field" value={(draft.features ?? []).join(", ")} onChange={e => update("features", e.target.value.split(",").map(item => item.trim()).filter(Boolean))}/></Field></div><div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-28" value={draft.description ?? ""} onChange={e => update("description", e.target.value)}/></Field></div></div></div>
      <div className="card p-6"><h2 className="flex items-center gap-2 text-xl font-black"><Images className="text-sage"/>Gallery</h2><input className="mt-4 block w-full text-sm" type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files ?? []))}/><label className="mt-4 block text-sm font-semibold"><span className="mb-2 flex items-center gap-2"><Video size={16} className="text-sage"/>Optional video URL</span><input className="field" type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..."/></label>{photos.length ? <p className="mt-3 text-xs font-bold text-sage">{photos.length} photo(s) ready to upload.</p> : null}</div></div>
      <aside className="card h-fit overflow-hidden"><div className="relative aspect-video bg-ink">{photos[0] ? <Image src={URL.createObjectURL(photos[0])} alt="Listing preview image" fill unoptimized className="object-cover"/> : <div className="flex h-full items-center justify-center text-white/55">Preview image</div>}</div><div className="p-6"><p className="text-xs font-bold uppercase text-sage">{draft.type || "property"} · {draft.availability || "status"}</p><h2 className="mt-2 text-2xl font-black">{draft.title || "Listing title"}</h2><p className="mt-1 text-sm text-ink/50">{draft.location || "Location"}</p><p className="mt-4 text-xl font-black">{formatListingPrice({ price: draft.price ?? null, price_status: draft.price_status ?? null })}</p><p className="mt-3 text-sm leading-6 text-ink/55">{draft.description || "Parsed description preview appears here."}</p>{error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}{saved ? <div className="mt-5 rounded-2xl bg-lime p-4 text-sm text-sage"><p className="flex items-center gap-2 font-black"><Check size={16}/>Listing saved.</p><div className="mt-3 flex flex-wrap gap-2"><Link className="btn-secondary !px-4 !py-2" href={listingPath}>Open listing</Link><button className="btn-secondary !px-4 !py-2" onClick={() => copy(fullLink)}><LinkIcon size={14}/> Copy link</button><button className="btn-secondary !px-4 !py-2" onClick={() => copy(`${saved.title} — ${formatListingPrice(saved)} — ${saved.location}\n${fullLink}`)}><Copy size={14}/> Copy share message</button></div></div> : <button onClick={save} disabled={busy} className="btn mt-5 w-full gap-2"><Save size={16}/>{busy ? "Saving…" : "Save listing"}</button>}</div></aside>
    </div>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>; }
