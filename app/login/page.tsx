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
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError("");
    const { error } = await createClient().auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) { setError(error.message === "Invalid login credentials" ? "The email or password is incorrect." : error.message); setLoading(false); return; }
    router.replace("/dashboard"); router.refresh();
  }

  return <main className="mx-auto flex min-h-[76vh] max-w-md items-center px-5 py-12 sm:px-6 sm:py-16">
    <form onSubmit={login} className="card w-full p-6 sm:p-8" noValidate>
      <Image src="/logo.png" alt="Realtors X logo" width={2048} height={772} className="mb-7 h-auto w-40 sm:w-44" priority/>
      <p className="eyebrow">Agent portal</p>
      <h1 className="mt-3 text-3xl font-black">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-ink/55">Sign in to manage listings, leads, and private inventory.</p>
      <label className="mt-7 block text-sm font-semibold">Email address<input className="field mt-2" type="email" inputMode="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={loading} required/></label>
      <label className="mt-4 block text-sm font-semibold">Password<input className="field mt-2" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={loading} required/></label>
      <div aria-live="polite">{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div>
      <button className="btn mt-6 w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      <p className="mt-5 text-center text-sm text-ink/50">New to Realtors X? <Link href="/signup" className="font-bold text-sage hover:underline">Create an account</Link></p>
    </form>
  </main>;
}
