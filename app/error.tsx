"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-16 text-center"><div className="card w-full p-10"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle/></span><h1 className="mt-5 text-3xl font-black">Something went wrong</h1><p className="mt-3 text-sm leading-6 text-ink/55">We could not load this page. Your information is safe—please try again.</p><button onClick={reset} className="btn mt-7 gap-2"><RotateCcw size={16}/>Try again</button></div></main>;
}
