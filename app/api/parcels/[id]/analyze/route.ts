import { NextResponse } from "next/server";
import { getParcel, updateParcel } from "@/lib/db";
import { runMockAnalysis } from "@/lib/mockAnalysis";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const parcel = getParcel(params.id);
  if (!parcel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (parcel.documents.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one document before running analysis." },
      { status: 400 }
    );
  }
  const updated = updateParcel(params.id, (p) => ({
    ...p,
    documents: p.documents.map((d) => ({ ...d, analyzed: true })),
    analysis: runMockAnalysis(p),
    status: "completed",
  }));
  return NextResponse.json({ parcel: updated });
}
