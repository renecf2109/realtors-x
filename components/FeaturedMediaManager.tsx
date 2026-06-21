"use client";

import { Film, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { useState } from "react";
import { FeaturedMediaAsset } from "@/components/FeaturedMediaAsset";
import { featuredMediaPlacements, validateFeaturedMedia } from "@/lib/featuredMedia";
import { createClient } from "@/lib/supabase/client";
import type { FeaturedMedia, FeaturedMediaInput, FeaturedMediaPlacement, FeaturedMediaType } from "@/lib/types";

const blank: FeaturedMediaInput = { title: "", description: "", media_type: "image", media_url: "", thumbnail_url: null, placement: "homepage_strip", link_url: null, sort_order: 0, is_active: true, starts_at: null, ends_at: null };

export function FeaturedMediaManager({ initialItems, userId }: { initialItems: FeaturedMedia[]; userId: string }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<FeaturedMedia | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  function createNew() { setEditing(null); setOpen(true); setNotice(null); }
  function edit(item: FeaturedMedia) { setEditing(item); setOpen(true); setNotice(null); }

  async function save(input: FeaturedMediaInput) {
    const message = validateFeaturedMedia(input);
    if (message) return { ok: false as const, message };
    const normalized = { ...input, title: input.title.trim(), description: input.description.trim(), media_url: input.media_url.trim(), thumbnail_url: input.thumbnail_url?.trim() || null, link_url: input.link_url?.trim() || null };
    if (editing) {
      const { data, error } = await supabase.from("featured_media").update(normalized).eq("id", editing.id).select().single();
      if (error) return { ok: false as const, message: error.message };
      setItems(value => value.map(item => item.id === editing.id ? data as FeaturedMedia : item));
      setNotice({ type: "success", text: "Featured media updated." });
    } else {
      const { data, error } = await supabase.from("featured_media").insert({ ...normalized, created_by: userId }).select().single();
      if (error) return { ok: false as const, message: error.message };
      setItems(value => [...value, data as FeaturedMedia].sort(sortMedia));
      setNotice({ type: "success", text: "Featured media added." });
    }
    setOpen(false);
    return { ok: true as const };
  }

  async function toggle(item: FeaturedMedia) {
    setNotice(null);
    const { data, error } = await supabase.from("featured_media").update({ is_active: !item.is_active }).eq("id", item.id).select().single();
    if (error) { setNotice({ type: "error", text: error.message }); return; }
    setItems(value => value.map(current => current.id === item.id ? data as FeaturedMedia : current));
    setNotice({ type: "success", text: `${item.title} is now ${item.is_active ? "inactive" : "active"}.` });
  }

  async function remove(item: FeaturedMedia) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setNotice(null);
    const { error } = await supabase.from("featured_media").delete().eq("id", item.id);
    if (error) { setNotice({ type: "error", text: error.message }); return; }
    setItems(value => value.filter(current => current.id !== item.id));
    setNotice({ type: "success", text: "Featured media deleted." });
  }

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin media library</p><h1 className="mt-2 text-4xl font-black tracking-tight">Featured media</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Manage URL-based images and videos across the website. Media files stay outside the code repository.</p></div><button onClick={createNew} className="btn gap-2"><Plus size={17}/>Add featured media</button></div>
    <div aria-live="polite">{notice ? <p className={`mt-6 rounded-2xl border p-4 text-sm ${notice.type === "success" ? "border-blue-200 bg-lime text-sage" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.text}</p> : null}</div>
    {items.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{[...items].sort(sortMedia).map(item => <article key={item.id} className="card overflow-hidden"><div className="relative aspect-video overflow-hidden bg-ink"><FeaturedMediaAsset item={item}/><span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${item.is_active ? "bg-sage text-white" : "bg-white text-ink"}`}>{item.is_active ? "Active" : "Inactive"}</span></div><div className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-sage">{placementLabel(item.placement)} · {item.media_type}</p><h2 className="mt-2 text-xl font-black">{item.title}</h2></div><span className="rounded-full bg-cream px-3 py-1 text-xs font-bold">Order {item.sort_order}</span></div>{item.description ? <p className="mt-3 text-sm leading-6 text-ink/55">{item.description}</p> : null}<div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-4"><button onClick={() => edit(item)} className="btn-secondary gap-2 !px-4 !py-2"><Pencil size={14}/>Edit</button><button onClick={() => toggle(item)} className="btn-secondary gap-2 !px-4 !py-2"><Power size={14}/>{item.is_active ? "Deactivate" : "Activate"}</button><button onClick={() => remove(item)} className="btn-secondary gap-2 !px-4 !py-2 text-red-600"><Trash2 size={14}/>Delete</button></div></div></article>)}</div> : <div className="card mt-8 p-12 text-center"><Film className="mx-auto text-sage"/><h2 className="mt-4 text-xl font-black">No featured media yet</h2><p className="mt-2 text-sm text-ink/50">Add an HTTPS image or video URL to create the first feature.</p><button onClick={createNew} className="btn mt-6 gap-2"><Plus size={16}/>Add media</button></div>}
    {open ? <FeaturedMediaForm item={editing} onClose={() => setOpen(false)} onSave={save}/> : null}
  </section>;
}

function FeaturedMediaForm({ item, onClose, onSave }: { item: FeaturedMedia | null; onClose: () => void; onSave: (input: FeaturedMediaInput) => Promise<{ ok: true } | { ok: false; message: string }> }) {
  const [draft, setDraft] = useState<FeaturedMediaInput>(item ? stripReadOnly(item) : blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previewReady = isHttps(draft.media_url);
  function update<K extends keyof FeaturedMediaInput>(key: K, value: FeaturedMediaInput[K]) { setDraft(current => ({ ...current, [key]: value })); }
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); const result = await onSave(draft); setBusy(false); if (!result.ok) setError(result.message); }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/65 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="media-form-title"><div className="mx-auto my-3 max-w-5xl rounded-3xl bg-cream p-5 shadow-soft sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Featured media editor</p><h2 id="media-form-title" className="mt-1 text-2xl font-black">{item ? "Edit media" : "Add media"}</h2></div><button type="button" onClick={onClose} aria-label="Close featured media editor" className="rounded-full p-2 hover:bg-white"><X/></button></div><form onSubmit={submit} className="mt-7 grid gap-7 lg:grid-cols-[1fr_360px]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><input className="field" value={draft.title} maxLength={160} onChange={e => update("title", e.target.value)} required/></Field><Field label="Media type"><select className="field" value={draft.media_type} onChange={e => update("media_type", e.target.value as FeaturedMediaType)}><option value="image">Image</option><option value="video">Video</option></select></Field><div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-24" value={draft.description} onChange={e => update("description", e.target.value)}/></Field></div><div className="sm:col-span-2"><Field label="Media URL (HTTPS)"><input className="field" type="url" inputMode="url" value={draft.media_url} onChange={e => update("media_url", e.target.value)} placeholder="https://..." required/></Field></div><div className="sm:col-span-2"><Field label="Video thumbnail / poster URL (optional)"><input className="field" type="url" inputMode="url" value={draft.thumbnail_url ?? ""} onChange={e => update("thumbnail_url", e.target.value || null)} placeholder="https://..."/></Field></div><Field label="Placement"><select className="field" value={draft.placement} onChange={e => update("placement", e.target.value as FeaturedMediaPlacement)}>{featuredMediaPlacements.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field><Field label="Sort order"><input className="field" type="number" step="1" value={draft.sort_order} onChange={e => update("sort_order", Number(e.target.value))}/></Field><div className="sm:col-span-2"><Field label="Destination link (optional)"><input className="field" value={draft.link_url ?? ""} onChange={e => update("link_url", e.target.value || null)} placeholder="/projects/example or https://..."/></Field></div><Field label="Starts at (optional)"><input className="field" type="datetime-local" value={toLocalDateTime(draft.starts_at)} onChange={e => update("starts_at", fromLocalDateTime(e.target.value))}/></Field><Field label="Ends at (optional)"><input className="field" type="datetime-local" value={toLocalDateTime(draft.ends_at)} onChange={e => update("ends_at", fromLocalDateTime(e.target.value))}/></Field><label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-sage" checked={draft.is_active} onChange={e => update("is_active", e.target.checked)}/><span>Active and publicly visible during its schedule</span></label></div><aside><p className="text-sm font-bold">Preview before saving</p><div className="relative mt-3 aspect-video overflow-hidden rounded-3xl bg-ink">{previewReady ? <FeaturedMediaAsset item={{ ...draft, id: "preview", created_by: null, created_at: "", updated_at: "" } as FeaturedMedia}/> : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/55">Enter a valid HTTPS media URL to preview it.</div>}</div><div className="mt-4 rounded-2xl bg-white p-4"><p className="text-xs font-bold uppercase text-sage">{placementLabel(draft.placement)}</p><p className="mt-2 font-black">{draft.title || "Media title"}</p><p className="mt-1 text-sm leading-6 text-ink/50">{draft.description || "Description preview"}</p></div>{error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" aria-live="polite">{error}</p> : null}<div className="mt-5 flex flex-col gap-3"><button className="btn" disabled={busy}>{busy ? "Saving…" : item ? "Save changes" : "Add featured media"}</button><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button></div></aside></form></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>; }
function stripReadOnly(item: FeaturedMedia): FeaturedMediaInput { return { title: item.title, description: item.description, media_type: item.media_type, media_url: item.media_url, thumbnail_url: item.thumbnail_url, placement: item.placement, link_url: item.link_url, sort_order: item.sort_order, is_active: item.is_active, starts_at: item.starts_at, ends_at: item.ends_at }; }
function sortMedia(a: FeaturedMedia, b: FeaturedMedia) { return a.placement.localeCompare(b.placement) || a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at); }
function placementLabel(value: FeaturedMediaPlacement) { return featuredMediaPlacements.find(option => option.value === value)?.label ?? value; }
function isHttps(value: string) { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function toLocalDateTime(value: string | null) { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function fromLocalDateTime(value: string) { return value ? new Date(value).toISOString() : null; }
