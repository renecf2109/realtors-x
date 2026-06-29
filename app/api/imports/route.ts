import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractListing } from "@/lib/aiWorkbench";
import { markDuplicate, verifiedRowFromAI, type MappedListing, type VerifiedImportRow } from "@/lib/listingImport";
import type { ImportRowStatus } from "@/lib/types";

const allowedTypes = ["csv", "xlsx", "xls"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in as an agent or admin." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "agent"].includes(profile.role)) return NextResponse.json({ error: "Only agents and admins can import listings." }, { status: 403 });

  try {
    const body = await request.json();
    const fileName = typeof body.file_name === "string" ? body.file_name.trim().slice(0, 240) : "";
    const fileType = typeof body.file_type === "string" ? body.file_type.toLowerCase() : "";
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 5000) as Record<string, unknown>[] : [];
    const detectedColumns = Array.isArray(body.columns) ? body.columns.map(String).filter(Boolean).slice(0, 80) : Array.from(new Set(rows.flatMap(row => Object.keys(row)))).slice(0, 80);
    if (!fileName || !allowedTypes.includes(fileType) || !rows.length) return NextResponse.json({ error: "Choose a non-empty CSV or Excel file." }, { status: 400 });

    const { data: importRecord, error: importError } = await supabase.from("listing_imports").insert({ created_by: user.id, file_name: fileName, file_type: fileType, total_rows: rows.length }).select().single();
    if (importError) throw importError;
    await supabase.from("ai_uploads").insert({ created_by: user.id, import_id: importRecord.id, file_name: fileName, file_type: fileType, file_size: Number(body.file_size) || null, status: "processing" });

    const { data: existing } = await supabase.from("listings").select("title,location,price,price_status,type");
    const duplicateKeys = new Set((existing ?? []).map(item => duplicateKey(item)));
    const verifiedRows: VerifiedImportRow[] = [];

    for (let index = 0; index < rows.length; index++) {
      const ai = await extractListing({ row: rows[index], columns: detectedColumns, fileName });
      let verified = verifiedRowFromAI(rows[index], index + 2, ai.data, ai.source, ai.warning);
      if (verified.duplicate_key && duplicateKeys.has(verified.duplicate_key)) verified = markDuplicate(verified);
      if (["imported", "optional_skipped"].includes(verified.row_status)) {
        const mapped = verified.mapped_data as MappedListing;
        const { data: listing, error } = await supabase.from("listings").insert({
          agent_id: user.id, title: mapped.title, price: mapped.price, price_status: mapped.price_status,
          location: mapped.location, type: mapped.type, availability: mapped.availability,
          bedrooms: mapped.bedrooms, bathrooms: mapped.bathrooms, size: mapped.size,
          description: mapped.description, features: mapped.features, images: mapped.images,
          project_name: mapped.project_name, completion_date: mapped.completion_date, investment_opportunity: false, show_developer_to_public: false,
          source_import_id: importRecord.id, source_row_number: verified.row_number
        }).select().single();
        if (error) verified = { ...verified, row_status: "needs_review", messages: [...verified.messages, "Database validation needs review"] };
        else {
          verified = { ...verified, mapped_data: { ...verified.mapped_data, id: listing.id } };
          duplicateKeys.add(verified.duplicate_key!);
          const mediaRows = [
            ...mapped.images.map((url, mediaIndex) => ({ listing_id: listing.id, media_type: "image", media_url: url, sort_order: mediaIndex })),
            ...(mapped.videos ?? []).map((url, mediaIndex) => ({ listing_id: listing.id, media_type: "video", media_url: url, sort_order: mapped.images.length + mediaIndex }))
          ];
          if (mediaRows.length) await supabase.from("listing_media").insert(mediaRows);
        }
      }
      verifiedRows.push(verified);
    }

    const rowPayload = verifiedRows.map(row => ({ import_id: importRecord.id, row_number: row.row_number, raw_data: row.raw_data, mapped_data: row.mapped_data, row_status: row.row_status, messages: row.messages, listing_id: typeof row.mapped_data.id === "string" ? row.mapped_data.id : null }));
    const { error: rowError } = await supabase.from("listing_import_rows").insert(rowPayload);
    if (rowError) throw rowError;
    const counts = countStatuses(verifiedRows);
    const finalStatus = counts.required_missing || counts.needs_review ? "completed_with_review" : "completed";
    await Promise.all([
      supabase.from("listing_imports").update({ imported_rows: counts.imported, optional_skipped_rows: counts.optional_skipped, review_rows: counts.needs_review, failed_rows: counts.required_missing, duplicate_rows: counts.duplicate_skipped, status: finalStatus, completed_at: new Date().toISOString() }).eq("id", importRecord.id),
      supabase.from("ai_uploads").update({ status: "completed" }).eq("import_id", importRecord.id)
    ]);
    return NextResponse.json({ import_id: importRecord.id, status: finalStatus, counts, columns: detectedColumns, rows: verifiedRows });
  } catch {
    return NextResponse.json({ error: "The import could not be completed. Check the file and try again." }, { status: 500 });
  }
}

function duplicateKey(item: { title?: unknown; location?: unknown; price?: unknown; price_status?: unknown; type?: unknown }) { return [item.title, item.location, item.price ?? item.price_status, item.type].map(value => String(value ?? "").toLowerCase()).join("|"); }
function countStatuses(rows: VerifiedImportRow[]) { return rows.reduce((counts, row) => ({ ...counts, [row.row_status]: counts[row.row_status] + 1 }), { imported: 0, optional_skipped: 0, needs_review: 0, required_missing: 0, duplicate_skipped: 0 } as Record<ImportRowStatus, number>); }
