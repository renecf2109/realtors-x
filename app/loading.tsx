export default function Loading() {
  return <main className="mx-auto max-w-7xl px-6 py-16" aria-busy="true" aria-label="Loading page"><div className="h-4 w-28 animate-pulse rounded-full bg-sage/15"/><div className="mt-5 h-12 max-w-xl animate-pulse rounded-2xl bg-ink/10"/><div className="mt-10 grid gap-5 md:grid-cols-3">{[1,2,3].map(item => <div key={item} className="card h-64 animate-pulse bg-white/70"/>)}</div></main>;
}
