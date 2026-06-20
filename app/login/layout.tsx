import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agent login", description: "Sign in to the Realtors X agent workspace." };
export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
