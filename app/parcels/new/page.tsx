"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconShield } from "@/components/icons";

interface Field {
  name: string;
  label: string;
  placeholder: string;
  span: 1 | 2;
  type?: string;
  default?: string;
}

const FIELDS: Field[] = [
  { name: "parcelName", label: "Parcel name / reference", placeholder: "e.g. Attibele Highway Frontage", span: 2 },
  { name: "surveyNumber", label: "Survey number", placeholder: "e.g. 112/2B", span: 1 },
  { name: "areaGuntas", label: "Extent (in guntas)", placeholder: "e.g. 240", span: 1, type: "number" },
  { name: "village", label: "Village", placeholder: "e.g. Bashettihalli", span: 1 },
  { name: "taluk", label: "Taluk", placeholder: "e.g. Doddaballapura", span: 1 },
  { name: "district", label: "District", placeholder: "e.g. Bengaluru Rural", span: 1 },
  { name: "state", label: "State", placeholder: "Karnataka", span: 1, default: "Karnataka" },
  { name: "claimedOwner", label: "Claimed owner (as per deed)", placeholder: "e.g. Sri Mahesh Gowda S/o Late Ramaiah", span: 2 },
  { name: "purpose", label: "Purpose of diligence", placeholder: "e.g. Acquisition for warehousing", span: 2 },
];

export default function NewParcelPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create parcel");
      router.push(`/parcels/${data.parcel.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="px-1.5 text-slate-300">/</span>
        <span className="text-slate-700">New Diligence</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <IconShield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Open a new diligence case
          </h1>
          <p className="text-sm text-slate-500">
            Capture the parcel particulars. You&apos;ll upload records and run
            the analysis on the next screen.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div
              key={f.name}
              className={f.span === 2 ? "sm:col-span-2" : "sm:col-span-1"}
            >
              <label
                htmlFor={f.name}
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {f.label}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                defaultValue={f.default}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            href="/"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create case"}
            {!submitting && <IconArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
