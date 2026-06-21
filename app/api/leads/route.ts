import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["name", "phone", "budget", "preferred_area", "requested_property_type"];
    if (required.some(key => !body[key])) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    const propertyIds = Array.isArray(body.property_ids) ? body.property_ids.filter((id: unknown) => typeof id === "string") : [];
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: routing } = await supabase.rpc("resolve_lead_route", { p_property_ids: propertyIds });
    const route = routing as { agent_id?: string; phone?: string; route?: string } | null;
    const payload = {
      name: String(body.name).trim(), phone: String(body.phone).trim(), budget: Number(body.budget),
      preferred_area: String(body.preferred_area).trim(), move_in_date: body.move_in_date || null,
      requested_property_type: String(body.requested_property_type).trim(), property_ids: propertyIds,
      inquiry: body.inquiry ? String(body.inquiry).trim() : null, assigned_agent_id: route?.agent_id ?? null,
      lead_user_id: user?.id ?? null
    };
    if (!Number.isFinite(payload.budget) || payload.budget < 0) return NextResponse.json({ error: "Please enter a valid budget." }, { status: 400 });
    const { error } = await supabase.from("leads").insert(payload);
    if (error) throw error;
    const { data: selected } = propertyIds.length ? await supabase.from("public_properties").select("id,title,price").in("id", propertyIds) : { data: [] };
    const listingLines = (selected ?? []).map(property => `• ${property.title} — ${property.price === null ? "Price on request" : `$${Number(property.price).toLocaleString()}`} — https://realtors-x.vercel.app/listings/${property.id}`);
    const message = [
      "New Realtors X lead", `Name: ${payload.name}`, `Phone: ${payload.phone}`,
      `Budget: $${payload.budget.toLocaleString()}`, `Preferred area: ${payload.preferred_area}`,
      `Property type: ${payload.requested_property_type}`, `Move-in: ${payload.move_in_date || "Flexible"}`,
      payload.inquiry ? `Inquiry: ${payload.inquiry}` : "",
      listingLines.length ? `Interested listings:\n${listingLines.join("\n")}` : "General property inquiry"
    ].filter(Boolean).join("\n");
    const digits = route?.phone?.replace(/\D/g, "") ?? "";
    const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    return NextResponse.json({ ok: true, whatsapp_url: whatsappUrl, routed_to: route?.route ?? "admin" });
  } catch {
    return NextResponse.json({ error: "We couldn't save your details. Please try again." }, { status: 500 });
  }
}
