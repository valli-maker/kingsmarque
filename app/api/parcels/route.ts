import { NextResponse } from "next/server";
import { createParcel, listParcels } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ parcels: listParcels() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const required = [
    "parcelName",
    "surveyNumber",
    "village",
    "taluk",
    "district",
    "state",
    "claimedOwner",
  ];
  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === "") {
      return NextResponse.json(
        { error: `Missing field: ${key}` },
        { status: 400 }
      );
    }
  }
  const parcel = createParcel({
    parcelName: String(body.parcelName),
    surveyNumber: String(body.surveyNumber),
    village: String(body.village),
    taluk: String(body.taluk),
    district: String(body.district),
    state: String(body.state),
    areaGuntas: Number(body.areaGuntas) || 0,
    claimedOwner: String(body.claimedOwner),
    purpose: String(body.purpose ?? ""),
  });
  return NextResponse.json({ parcel }, { status: 201 });
}
