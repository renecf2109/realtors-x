import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AgentProfile } from "@/lib/types";

export async function requireAdmin(nextPath = "/admin") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const { data: profile } = await supabase.from("profiles").select("id,email,full_name,whatsapp_phone,role").eq("id", user.id).maybeSingle();
  if ((profile as AgentProfile | null)?.role !== "admin") redirect("/dashboard");
  return { supabase, user, profile: profile as AgentProfile };
}
