"use client";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property, PropertyInput } from "@/lib/types";

const empty: PropertyInput = { title:"", price:0, location:"", bedrooms:1, bathrooms:1, size:0, type:"apartment", description:"", features:[], availability:"available" };

export function ListingsManager({ initialProperties }: { initialProperties: Property[] }) {
  const [items, setItems] = useState(initialProperties);
  const [editing, setEditing] = useState<Property | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();
  function showCreate(){setEditing(null);setOpen(true)}
  async function remove(id:string){ if(!confirm("Delete this listing?")) return; const {error}=await supabase.from("properties").delete().eq("id",id); if(!error)setItems(v=>v.filter(x=>x.id!==id)); }
  async function save(input: PropertyInput){
    setBusy(true);
    if(editing){const {data,error}=await supabase.from("properties").update(input).eq("id",editing.id).select().single(); if(!error)setItems(v=>v.map(x=>x.id===editing.id?data as Property:x));}
    else {const {data:{user}}=await supabase.auth.getUser(); if(user){const {data,error}=await supabase.from("properties").insert({...input,agent_id:user.id}).select().single();if(!error)setItems(v=>[data as Property,...v]);}}
    setBusy(false);setOpen(false);
  }
  return <section><div className="flex items-end justify-between"><div><p className="text-sm font-semibold text-sage">Inventory</p><h1 className="mt-1 text-4xl font-black">Property listings</h1></div><button className="btn gap-2" onClick={showCreate}><Plus size={17}/> Add listing</button></div>
    <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(p=><article key={p.id} className="card p-6"><div className="flex justify-between gap-4"><div><span className="rounded-full bg-lime/60 px-3 py-1 text-xs font-bold capitalize">{p.availability}</span><h2 className="mt-4 text-xl font-bold">{p.title}</h2><p className="mt-1 text-sm text-ink/50">{p.location}</p></div><p className="text-lg font-black">${Number(p.price).toLocaleString()}</p></div><p className="mt-5 text-sm text-ink/60">{p.bedrooms} bd · {p.bathrooms} ba · {Number(p.size).toLocaleString()} sq ft · <span className="capitalize">{p.type}</span></p><div className="mt-5 flex gap-2 border-t border-ink/10 pt-4"><button onClick={()=>{setEditing(p);setOpen(true)}} className="btn-secondary gap-2 !px-4 !py-2"><Pencil size={14}/> Edit</button><button onClick={()=>remove(p.id)} className="btn-secondary gap-2 !px-4 !py-2 text-red-600"><Trash2 size={14}/> Delete</button></div></article>)}</div>
    {items.length===0&&<div className="card mt-8 p-12 text-center text-ink/50">No listings yet. Add your first property.</div>}
    {open&&<PropertyModal property={editing} busy={busy} onClose={()=>setOpen(false)} onSave={save}/>} </section>;
}

function PropertyModal({property,busy,onClose,onSave}:{property:Property|null,busy:boolean,onClose:()=>void,onSave:(p:PropertyInput)=>void}){
  const [form,setForm]=useState<PropertyInput>(property?{title:property.title,price:property.price,location:property.location,bedrooms:property.bedrooms,bathrooms:property.bathrooms,size:property.size,type:property.type,description:property.description,features:property.features,availability:property.availability}:empty);
  const [featureText,setFeatureText]=useState(form.features.join(", "));
  const field=(key:keyof PropertyInput,value:string|number)=>setForm(v=>({...v,[key]:value}));
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm"><form onSubmit={e=>{e.preventDefault();onSave({...form,features:featureText.split(",").map(x=>x.trim()).filter(Boolean)})}} className="mx-auto my-6 max-w-2xl rounded-3xl bg-cream p-7 shadow-soft"><div className="flex justify-between"><div><p className="text-sm font-semibold text-sage">{property?"Update property":"New property"}</p><h2 className="text-2xl font-black">Listing details</h2></div><button type="button" onClick={onClose}><X/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Title"><input className="field" value={form.title} onChange={e=>field("title",e.target.value)} required/></Field><Field label="Price"><input className="field" type="number" min="0" value={form.price} onChange={e=>field("price",+e.target.value)} required/></Field><Field label="Location"><input className="field" value={form.location} onChange={e=>field("location",e.target.value)} required/></Field><Field label="Type"><select className="field" value={form.type} onChange={e=>field("type",e.target.value)}><option>apartment</option><option>house</option><option>villa</option><option>townhouse</option><option>studio</option><option>office</option><option>land</option></select></Field><Field label="Bedrooms"><input className="field" type="number" min="0" value={form.bedrooms} onChange={e=>field("bedrooms",+e.target.value)}/></Field><Field label="Bathrooms"><input className="field" type="number" min="0" step="0.5" value={form.bathrooms} onChange={e=>field("bathrooms",+e.target.value)}/></Field><Field label="Size (sq ft)"><input className="field" type="number" min="0" value={form.size} onChange={e=>field("size",+e.target.value)}/></Field><Field label="Availability"><select className="field" value={form.availability} onChange={e=>field("availability",e.target.value)}><option>available</option><option>reserved</option><option>sold</option><option>rented</option></select></Field><div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-24" value={form.description} onChange={e=>field("description",e.target.value)} required/></Field></div><div className="sm:col-span-2"><Field label="Features (comma-separated)"><input className="field" value={featureText} onChange={e=>setFeatureText(e.target.value)} placeholder="Balcony, parking, sea view"/></Field></div></div><div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy?"Saving…":"Save listing"}</button></div></form></div>;
}
function Field({label,children}:{label:string,children:React.ReactNode}){return <label className="block text-sm font-semibold"><span className="mb-2 block">{label}</span>{children}</label>}
