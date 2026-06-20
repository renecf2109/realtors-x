"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareActions({ title, compact = false }: { title: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = () => window.location.href;

  async function copyLink() {
    await navigator.clipboard.writeText(currentUrl());
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (navigator.share) await navigator.share({ title, text: `View ${title} on Realtors X`, url: currentUrl() });
    else await copyLink();
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${currentUrl()}`)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="flex flex-wrap gap-2">
    <button onClick={copyLink} className="btn-secondary gap-2 !px-4 !py-2">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : compact ? "Copy" : "Copy link"}</button>
    <button onClick={whatsapp} className="btn-secondary gap-2 !border-[#25D366]/30 !px-4 !py-2 !text-[#128C4A]"><MessageCircle size={15}/> WhatsApp</button>
    <button onClick={share} className="btn gap-2 !px-4 !py-2"><Share2 size={15}/> Share</button>
  </div>;
}
