import { NextResponse } from "next/server";
import { getParcel } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const parcel = getParcel(params.id);
  if (!parcel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ parcel });
}
