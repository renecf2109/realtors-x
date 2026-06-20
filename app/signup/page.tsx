"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signup(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    const { data, error } = await createClient().auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) { router.push("/dashboard"); router.refresh(); return; }
    setMessage("Check your email to confirm your Realtors X account."); setLoading(false);
  }

  return <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-6 py-16">
    <form onSubmit={signup} className="card w-full p-8">
      <Image src="/logo.png" alt="Realtors X logo" width={2048} height={772} className="mb-7 h-auto w-44" priority/>
      <p className="text-xs font-bold uppercase tracking-widest text-sage">Agent registration</p>
      <h1 className="mt-3 text-3xl font-black">Join Realtors X</h1>
      <p className="mt-2 text-sm text-ink/55">Create your account to manage listings and buyer leads.</p>
      <label className="mt-7 block text-sm font-semibold">Email<input className="field mt-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label className="mt-4 block text-sm font-semibold">Password<input className="field mt-2" type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-xl bg-lime p-3 text-sm text-sage">{message}</p>}
      <button className="btn mt-6 w-full" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
      <p className="mt-5 text-center text-xs text-ink/45">Already have an account? <Link href="/login" className="font-bold text-sage hover:underline">Sign in</Link></p>
    </form>
  </main>;
}
