"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }

  return <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-6 py-16">
    <form onSubmit={login} className="card w-full p-8">
      <Image src="/logo.png" alt="Realtors X logo" width={2048} height={772} className="mb-7 h-auto w-44" priority/>
      <p className="text-xs font-bold uppercase tracking-widest text-sage">Agent portal</p>
      <h1 className="mt-3 text-3xl font-black">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/55">Sign in with your agent account.</p>
      <label className="mt-7 block text-sm font-semibold">Email<input className="field mt-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label className="mt-4 block text-sm font-semibold">Password<input className="field mt-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="btn mt-6 w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      <p className="mt-5 text-center text-xs text-ink/45">New to Realtors X? <Link href="/signup" className="font-bold text-sage hover:underline">Create an account</Link></p>
    </form>
  </main>;
}
