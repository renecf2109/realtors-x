import type { Metadata } from "next";
import { ChatExperience } from "@/components/ChatExperience";

export const metadata: Metadata = { title: "AI property search", description: "Search live real estate listings naturally with the Realtors X AI property assistant." };
export default function ChatPage(){return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14"><div className="mb-8 max-w-2xl"><p className="eyebrow">Property concierge</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Let’s find your place.</h1><p className="mt-3 leading-7 text-ink/55">Describe your ideal property naturally. Mention your budget, area, size, and must-haves.</p></div><ChatExperience/></main>}
