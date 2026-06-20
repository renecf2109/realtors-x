"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signup(e: React.FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError("Enter a valid email address."); return; }
    if (password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }
    setLoading(true);
    const { data, error } = await createClient().auth.signUp({ email: normalizedEmail, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) { router.replace("/dashboard"); router.refresh(); return; }
    setMessage("Check your inbox and confirm your email. You can then sign in to the agent portal."); setLoading(false);
  }

  return <main className="mx-auto flex min-h-[76vh] max-w-md items-center px-5 py-12 sm:px-6 sm:py-16">
    <form onSubmit={signup} className="card w-full p-6 sm:p-8" noValidate>
      <Image src="/logo.png" alt="Realtors X logo" width={2048} height={772} className="mb-7 h-auto w-40 sm:w-44" priority/>
      <p className="eyebrow">Agent registration</p>
      <h1 className="mt-3 text-3xl font-black">Join Realtors X</h1>
      <p className="mt-2 text-sm leading-6 text-ink/55">Create an account to manage listings and buyer leads.</p>
      <label className="mt-7 block text-sm font-semibold">Email address<input className="field mt-2" type="email" inputMode="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={loading} required/></label>
      <label className="mt-4 block text-sm font-semibold">Password<input className="field mt-2" type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={loading} aria-describedby="password-help" required/><span id="password-help" className="mt-2 block text-xs font-normal text-ink/45">At least 8 characters.</span></label>
      <label className="mt-4 block text-sm font-semibold">Confirm password<input className="field mt-2" type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} disabled={loading} required/></label>
      <div aria-live="polite">{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-4 rounded-xl border border-blue-200 bg-lime p-3 text-sm text-sage">{message}</p>}</div>
      <button className="btn mt-6 w-full" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
      <p className="mt-5 text-center text-sm text-ink/50">Already have an account? <Link href="/login" className="font-bold text-sage hover:underline">Sign in</Link></p>
    </form>
  </main>;
}
