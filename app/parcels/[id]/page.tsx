import { notFound } from "next/navigation";
import { getParcel } from "@/lib/db";
import ParcelWorkspace from "@/components/ParcelWorkspace";

export const dynamic = "force-dynamic";

export default function ParcelPage({ params }: { params: { id: string } }) {
  const parcel = getParcel(params.id);
  if (!parcel) notFound();
  return <ParcelWorkspace initialParcel={parcel} />;
}
