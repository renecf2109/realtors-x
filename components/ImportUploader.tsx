"use client";

import Link from "next/link";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import type { ImportRowStatus } from "@/lib/types";

type Result = { import_id: string; status: string; counts: Record<ImportRowStatus, number>; rows: { row_number: number; row_status: ImportRowStatus; messages: string[]; mapped_data: Record<string, unknown> }[] };
const statusStyle: Record<ImportRowStatus, string> = { imported: "bg-emerald-100 text-emerald-800", optional_skipped: "bg-blue-100 text-blue-800", needs_review: "bg-amber-100 text-amber-900", required_missing: "bg-red-100 text-red-800", duplicate_skipped: "bg-slate-200 text-slate-700" };

export function ImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function upload() {
    if (!file) return;
    setBusy(true); setError(""); setResult(null);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Keep import files under 10 MB.");
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["csv","xlsx","xls"].includes(extension)) throw new Error("Choose a CSV, XLSX, or XLS file.");
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      if (!rows.length) throw new Error("No listing rows were found in the first sheet.");
      if (rows.length > 5000) throw new Error("Phase 1 supports up to 5,000 rows per import.");
      const response = await fetch("/api/imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file_name: file.name, file_type: extension, file_size: file.size, rows }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed.");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Import failed."); }
    finally { setBusy(false); }
  }

  return <section>
    <p className="eyebrow">AI Workbench</p><h1 className="mt-2 text-4xl font-black">Import listings</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Upload a messy CSV or Excel file. Realtors X maps common column names, verifies every row, imports valid data, and isolates anything that needs attention.</p>
    <div className="card mt-8 p-6 sm:p-8"><label className="block cursor-pointer rounded-3xl border-2 border-dashed border-sage/30 bg-lime/30 p-8 text-center transition hover:border-sage"><FileSpreadsheet className="mx-auto text-sage" size={34}/><span className="mt-4 block text-lg font-black">{file ? file.name : "Choose CSV or Excel"}</span><span className="mt-2 block text-sm text-ink/50">CSV, XLSX, or XLS · up to 10 MB · first sheet · 5,000 rows</span><input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={event => setFile(event.target.files?.[0] ?? null)}/></label><button onClick={upload} disabled={!file || busy} className="btn mt-5 w-full gap-2"><Upload size={17}/>{busy ? "Mapping and verifying…" : "Import and organize"}</button>{error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" aria-live="polite">{error}</p> : null}</div>
    <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold"><Legend status="imported" label="Imported"/><Legend status="optional_skipped" label="Optional skipped"/><Legend status="needs_review" label="Needs review"/><Legend status="required_missing" label="Required missing"/><Legend status="duplicate_skipped" label="Duplicate/skipped"/></div>
    {result ? <div className="mt-8"><div className="grid gap-3 sm:grid-cols-5">{Object.entries(result.counts).map(([key,value]) => <div key={key} className="card p-4"><p className="text-xs capitalize text-ink/45">{key.replaceAll("_"," ")}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div><div className="card mt-5 overflow-hidden"><div className="flex items-center justify-between border-b border-ink/10 p-5"><div><h2 className="text-xl font-black">Row results</h2><p className="text-sm text-ink/50">Every decision remains visible for review.</p></div><Link href="/dashboard/imports" className="text-sm font-bold text-sage">All imports →</Link></div><div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="sticky top-0 bg-cream text-xs uppercase text-ink/45"><tr><th className="p-4">Row</th><th className="p-4">Status</th><th className="p-4">Mapped listing</th><th className="p-4">Notes</th></tr></thead><tbody>{result.rows.map(row => <tr key={row.row_number} className="border-t border-ink/5"><td className="p-4 font-bold">{row.row_number}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[row.row_status]}`}>{row.row_status.replaceAll("_"," ")}</span></td><td className="p-4"><b>{String(row.mapped_data.title || "Untitled")}</b><div className="text-xs text-ink/45">{String(row.mapped_data.location || "No location")}</div></td><td className="p-4 text-xs text-ink/55">{row.messages.join(" · ") || "All checks passed"}</td></tr>)}</tbody></table></div></div></div> : null}
  </section>;
}

function Legend({ status, label }: { status: ImportRowStatus; label: string }) { return <span className={`rounded-full px-3 py-2 ${statusStyle[status]}`}>{label}</span>; }
