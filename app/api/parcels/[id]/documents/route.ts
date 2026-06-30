import { NextResponse } from "next/server";
import { getParcel, updateParcel } from "@/lib/db";
import { DiligenceDocument, DocumentType } from "@/lib/types";

const VALID_TYPES: DocumentType[] = [
  "sale_deed",
  "encumbrance_certificate",
  "rtc_pahani",
  "khata",
  "mutation_extract",
  "survey_sketch",
  "tax_receipt",
  "conversion_certificate",
  "legal_heirship",
  "litigation_record",
  "other",
];

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!getParcel(params.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();
  const type: DocumentType = VALID_TYPES.includes(body.type)
    ? body.type
    : "other";
  const newDoc: DiligenceDocument = {
    id: `doc_${Math.abs(hash(params.id + body.name + Date.now())).toString(36)}`,
    name: String(body.name ?? "document.pdf"),
    type,
    sizeKb: Number(body.sizeKb) || 0,
    uploadedAt: new Date().toISOString(),
    analyzed: false,
  };
  const updated = updateParcel(params.id, (p) => ({
    ...p,
    documents: [...p.documents, newDoc],
    // A new document invalidates any prior analysis.
    analysis: null,
    status: p.status === "completed" ? "in_review" : p.status,
  }));
  return NextResponse.json({ parcel: updated }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!getParcel(params.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");
  const updated = updateParcel(params.id, (p) => ({
    ...p,
    documents: p.documents.filter((d) => d.id !== docId),
    analysis: null,
  }));
  return NextResponse.json({ parcel: updated });
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
