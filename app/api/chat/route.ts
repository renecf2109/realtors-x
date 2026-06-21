import { NextResponse } from "next/server";
import { categorizeRequest } from "@/lib/aiCategorizer";
import { parseSearch, rankProperties } from "@/lib/matching";
import { createClient } from "@/lib/supabase/server";
import type { Property, WorkbenchCategory } from "@/lib/types";

const inquiryCategories = new Set<WorkbenchCategory>(["property_search_lead","contact_request","showing_request","listing_submission","listing_update","featured_media_request","media_upload","admin_task","agent_support","unknown_needs_followup"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length < 2) return NextResponse.json({ error: "Please describe what you need." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const categorization = categorizeRequest(message);
    let conversationId = typeof body.conversation_id === "string" ? body.conversation_id : null;

    if (user) {
      if (conversationId) {
        const { data } = await supabase.from("ai_conversations").select("id").eq("id", conversationId).maybeSingle();
        if (!data) conversationId = null;
      }
      if (!conversationId) {
        const { data } = await supabase.from("ai_conversations").insert({ user_id: user.id, title: message.slice(0, 80), category: categorization.category }).select("id").single();
        conversationId = data?.id ?? null;
      }
      if (conversationId) await supabase.from("ai_messages").insert({ conversation_id: conversationId, sender: "user", content: message, structured_data: categorization });
    }

    const { data, error } = await supabase.from("public_properties").select("*");
    if (error) throw error;
    const intent = parseSearch(message);
    const shouldSuggest = ["property_search_lead","showing_request","contact_request","general_question"].includes(categorization.category);
    const matches = shouldSuggest ? rankProperties((data ?? []) as Property[], intent) : [];
    const reply = buildReply(categorization.category, matches.length);
    const safeMatches = matches.map(match => ({ ...match.property, developer_name: match.property.show_developer_to_public ? match.property.developer_name : null, show_developer_to_public: Boolean(match.property.show_developer_to_public), agent_id: undefined, matchReasons: match.reasons.length ? match.reasons : ["active listing"] }));

    if (inquiryCategories.has(categorization.category)) await supabase.from("ai_inquiries").insert({ lead_user_id: user?.id ?? null, conversation_id: conversationId, category: categorization.category, subject: message.slice(0, 120), details: message, listing_ids: safeMatches.map(item => item.id) });
    if (conversationId) await supabase.from("ai_messages").insert({ conversation_id: conversationId, sender: "assistant", content: reply, structured_data: { categorization, listing_ids: safeMatches.map(item => item.id) } });
    return NextResponse.json({ reply, intent, categorization, conversation_id: conversationId, matches: safeMatches });
  } catch {
    return NextResponse.json({ error: "I couldn't organize that request just now. Please try again." }, { status: 500 });
  }
}

function buildReply(category: WorkbenchCategory, matchCount: number) {
  if (category === "bulk_listing_import") return "This looks like a bulk listing import. Sign in as an agent or admin, then open Imports to upload CSV or Excel files.";
  if (category === "listing_submission") return "I organized this as a listing submission. An agent can review the details, or you can use the AI Listing Studio after signing in.";
  if (category === "listing_update") return "I organized this as a listing update request for an agent to review.";
  if (["featured_media_request","media_upload","admin_task"].includes(category)) return "I organized this as an admin request. It is now ready for admin review.";
  if (category === "agent_support") return "I organized this as an agent support request.";
  if (category === "unknown_needs_followup") return "I saved your request, but I need one more detail: are you searching for a property, submitting a listing, requesting contact, or asking for admin help?";
  if (matchCount) return `I found ${matchCount} active listing${matchCount === 1 ? "" : "s"} that match the details you shared. You can open, copy, or share any option below.`;
  return "I couldn't find a close active listing yet. Try widening the area or budget, or leave your contact details for an agent.";
}
