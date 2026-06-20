import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-16 text-center"><div><p className="eyebrow">404 · Not found</p><h1 className="mt-4 text-5xl font-black">This property has moved.</h1><p className="mt-4 text-ink/55">The page may no longer be available, but your next opportunity is still out there.</p><Link href="/" className="btn mt-7 gap-2"><ArrowLeft size={16}/>Return home</Link></div></main>;
}
