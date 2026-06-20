import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filterProperties, parseSearch } from "@/lib/matching";
import type { Property } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in as an agent." }, { status: 401 });
    const { message } = await request.json();
    if (typeof message !== "string" || message.trim().length < 2) return NextResponse.json({ error: "Describe the inventory you need." }, { status: 400 });
    const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const intent = parseSearch(message);
    const matches = filterProperties((data ?? []) as Property[], intent);
    return NextResponse.json({ intent, matches, reply: matches.length ? `Found ${matches.length} matching listing${matches.length === 1 ? "" : "s"}. Select any combination to send.` : "No listings match every condition. Try removing one condition." });
  } catch {
    return NextResponse.json({ error: "The inventory search could not be completed." }, { status: 500 });
  }
}
