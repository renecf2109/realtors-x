"use client";

import Link from "next/link";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import type { ImportRowStatus } from "@/lib/types";

type Result = { import_id: string; status: string; counts: Record<ImportRowStatus, number>; columns: string[]; rows: { row_number: number; row_status: ImportRowStatus; messages: string[]; mapped_data: Record<string, unknown> }[] };
const statusStyle: Record<ImportRowStatus, string> = { imported: "bg-emerald-100 text-emerald-800", optional_skipped: "bg-blue-100 text-blue-800", needs_review: "bg-amber-100 text-amber-900", required_missing: "bg-red-100 text-red-800", duplicate_skipped: "bg-slate-200 text-slate-700" };
const knownHeaders = ["project","project name","building","tower","unit","unit number","reference","type","unit type","layout","price","selling price","rent","amount","status","availability","beds","bedrooms","br","baths","bathrooms","area","sqft","size","floor","view","handover","delivery","completion","payment plan","photos","images","video","tour"];

export function ImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function normalizeHeader(value: unknown) { return String(value ?? "").toLowerCase().trim().replace(/[_/-]+/g, " ").replace(/\s+/g, " "); }
  function headerScore(cells: unknown[]) {
    return cells.reduce<number>((score, cell) => {
      const header = normalizeHeader(cell);
      if (!header) return score;
      return score + (knownHeaders.some(known => header === known || header.includes(known) || known.includes(header)) ? 2 : 0) + (/price|unit|project|status|type|area|bed|bath|view|floor/.test(header) ? 1 : 0);
    }, 0);
  }

  function rowsFromGrid(grid: unknown[][]) {
    const usefulRows = grid.filter(row => row.some(cell => String(cell ?? "").trim()));
    if (!usefulRows.length) return { rows: [] as Record<string, unknown>[], columns: [] as string[] };
    let headerIndex = 0; let bestScore = -1;
    usefulRows.slice(0, 20).forEach((row, index) => { const score = headerScore(row); if (score > bestScore) { bestScore = score; headerIndex = index; } });
    const headers = usefulRows[headerIndex].map((cell, index) => String(cell ?? "").trim() || `Column ${index + 1}`);
    const rows = usefulRows.slice(headerIndex + 1).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))).filter(row => Object.values(row).some(value => String(value ?? "").trim()));
    return { rows, columns: headers.filter(Boolean) };
  }

  async function rowsFromWorkbook(input: ArrayBuffer | string) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(input, { type: typeof input === "string" ? "string" : "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: "", blankrows: false });
    return rowsFromGrid(grid);
  }

  async function importRows(rows: Record<string, unknown>[], source: { name: string; type: "csv" | "xlsx" | "xls"; size?: number; columns: string[] }) {
    if (!rows.length) throw new Error("No listing rows were found.");
    if (rows.length > 5000) throw new Error("Realtors X supports up to 5,000 rows per import.");
    setDetectedColumns(source.columns);
    const response = await fetch("/api/imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file_name: source.name, file_type: source.type, file_size: source.size ?? null, columns: source.columns, rows }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Import failed.");
    setResult(data);
    if (Array.isArray(data.columns)) setDetectedColumns(data.columns);
  }

  async function uploadFile() {
    if (!file) return;
    setBusy(true); setError(""); setResult(null); setDetectedColumns([]);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Keep import files under 10 MB.");
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["csv","xlsx","xls"].includes(extension)) throw new Error("Choose a CSV, XLSX, or XLS file.");
      const parsed = await rowsFromWorkbook(await file.arrayBuffer());
      await importRows(parsed.rows, { name: file.name, type: extension as "csv" | "xlsx" | "xls", size: file.size, columns: parsed.columns });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Import failed."); }
    finally { setBusy(false); }
  }

  async function uploadPastedText() {
    setBusy(true); setError(""); setResult(null); setDetectedColumns([]);
    try {
      const text = pastedText.trim();
      if (!text) throw new Error("Paste listing text or copied spreadsheet rows first.");
      let parsed = await rowsFromWorkbook(text);
      if (!parsed.rows.length) parsed = { rows: [{ Description: text }], columns: ["Description"] };
      await importRows(parsed.rows, { name: "pasted-listings.csv", type: "csv", size: text.length, columns: parsed.columns });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Import failed."); }
    finally { setBusy(false); }
  }

  return <section>
    <p className="eyebrow">AI Workbench</p><h1 className="mt-2 text-4xl font-black">Import listings</h1><p className="mt-3 max-w-2xl leading-7 text-ink/55">Upload a messy CSV or Excel file, or paste copied spreadsheet rows directly. Realtors X detects the real header row, shows the columns found, maps real-estate terms, and imports every row that can become a listing.</p>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <div className="card p-6 sm:p-8"><label className="block cursor-pointer rounded-3xl border-2 border-dashed border-sage/30 bg-lime/30 p-8 text-center transition hover:border-sage"><FileSpreadsheet className="mx-auto text-sage" size={34}/><span className="mt-4 block text-lg font-black">{file ? file.name : "Choose CSV or Excel"}</span><span className="mt-2 block text-sm text-ink/50">CSV, XLSX, or XLS · up to 10 MB · smart header detection · 5,000 rows</span><input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={event => setFile(event.target.files?.[0] ?? null)}/></label><button onClick={uploadFile} disabled={!file || busy} className="btn mt-5 w-full gap-2"><Upload size={17}/>{busy ? "Mapping and verifying…" : "Import uploaded file"}</button></div>
      <div className="card p-6 sm:p-8"><div className="rounded-3xl border border-sage/20 bg-white p-5"><FileSpreadsheet className="text-sage"/><h2 className="mt-3 text-lg font-black">Paste listing text or spreadsheet rows</h2><p className="mt-2 text-sm leading-6 text-ink/55">Copy rows from Excel/Google Sheets, paste CSV text, or paste one full property description.</p><textarea className="field mt-4 min-h-40" value={pastedText} onChange={event => setPastedText(event.target.value)} placeholder={"Project,Unit,Layout,Selling Price,Availability\nMedyar,A-1203,2BR,250000,Available\n\nOr paste a full property description here..."}/><button onClick={uploadPastedText} disabled={!pastedText.trim() || busy} className="btn mt-5 w-full gap-2"><FileSpreadsheet size={17}/>{busy ? "Reading pasted content…" : "Import pasted text"}</button></div></div>
    </div>
    {detectedColumns.length ? <div className="card mt-5 p-5"><p className="text-sm font-black">Detected Excel columns</p><div className="mt-3 flex flex-wrap gap-2">{detectedColumns.map(column => <span key={column} className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink/60">{column}</span>)}</div></div> : null}
    {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" aria-live="polite">{error}</p> : null}
    <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold"><Legend status="imported" label="Imported"/><Legend status="optional_skipped" label="Optional skipped"/><Legend status="needs_review" label="Needs review"/><Legend status="required_missing" label="Required missing"/><Legend status="duplicate_skipped" label="Duplicate/skipped"/></div>
    {result ? <div className="mt-8"><div className="grid gap-3 sm:grid-cols-5">{Object.entries(result.counts).map(([key,value]) => <div key={key} className="card p-4"><p className="text-xs capitalize text-ink/45">{key.replaceAll("_"," ")}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div><div className="card mt-5 overflow-hidden"><div className="flex items-center justify-between border-b border-ink/10 p-5"><div><h2 className="text-xl font-black">Row results</h2><p className="text-sm text-ink/50">Green/blue rows are imported. Yellow rows need review. Red rows are truly missing required identity data.</p></div><Link href="/dashboard/imports" className="text-sm font-bold text-sage">All imports →</Link></div><div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="sticky top-0 bg-cream text-xs uppercase text-ink/45"><tr><th className="p-4">Row</th><th className="p-4">Status</th><th className="p-4">Mapped listing</th><th className="p-4">Notes / missing fields</th></tr></thead><tbody>{result.rows.map(row => <tr key={row.row_number} className="border-t border-ink/5"><td className="p-4 font-bold">{row.row_number}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[row.row_status]}`}>{row.row_status.replaceAll("_"," ")}</span></td><td className="p-4"><b>{String(row.mapped_data.title || "Untitled")}</b><div className="text-xs text-ink/45">{String(row.mapped_data.location || "No location")} · {String(row.mapped_data.type || "No type")} · {String(row.mapped_data.availability || "No status")}</div></td><td className="p-4 text-xs leading-5 text-ink/55">{row.messages.join(" · ") || "All checks passed"}</td></tr>)}</tbody></table></div></div></div> : null}
  </section>;
}

function Legend({ status, label }: { status: ImportRowStatus; label: string }) { return <span className={`rounded-full px-3 py-2 ${statusStyle[status]}`}>{label}</span>; }
