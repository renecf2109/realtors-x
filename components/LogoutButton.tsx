"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return <button className="text-sm font-semibold text-ink/55 hover:text-ink" onClick={async()=>{await createClient().auth.signOut(); router.push("/"); router.refresh();}}>Sign out</button>;
}
