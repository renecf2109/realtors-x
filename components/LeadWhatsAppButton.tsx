"use client";

import { MessageCircle } from "lucide-react";
import type { Lead } from "@/lib/types";

export function LeadWhatsAppButton({ lead }: { lead: Lead }) {
  function forward() {
    const message = [
      "Realtors X lead", `Name: ${lead.name}`, `Phone: ${lead.phone}`,
      `Budget: $${Number(lead.budget).toLocaleString()}`, `Area: ${lead.preferred_area}`,
      `Type: ${lead.requested_property_type}`, `Move-in: ${lead.move_in_date || "Flexible"}`,
      lead.inquiry ? `Inquiry: ${lead.inquiry}` : ""
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }
  return <button onClick={forward} className="rounded-full bg-[#25D366]/10 px-3 py-2 text-xs font-bold text-[#128C4A]"><MessageCircle className="mr-1 inline" size={14}/>Forward</button>;
}
