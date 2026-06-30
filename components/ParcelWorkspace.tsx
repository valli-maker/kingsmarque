"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  DOCUMENT_LABELS,
  DocumentType,
  ParcelCase,
  RISK_META,
  RiskLevel,
} from "@/lib/types";
import { formatDateTime, formatExtent } from "@/lib/format";
import { RiskBadge, StatusBadge } from "@/components/Badges";
import {
  IconAlert,
  IconChain,
  IconCheck,
  IconDoc,
  IconShield,
  IconTrash,
  IconUpload,
} from "@/components/icons";
import RiskReport from "@/components/RiskReport";
import TitleChain from "@/components/TitleChain";
import EmptyState from "@/components/EmptyState";

type Tab = "overview" | "documents" | "title" | "risk";

const UPLOAD_TYPES: DocumentType[] = [
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

export default function ParcelWorkspace({
  initialParcel,
}: {
  initialParcel: ParcelCase;
}) {
  const [parcel, setParcel] = useState<ParcelCase>(initialParcel);
  const [tab, setTab] = useState<Tab>(
    initialParcel.analysis ? "overview" : "documents"
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>("sale_deed");

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    // Brief artificial delay so the "analysing" state is visible.
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const res = await fetch(`/api/parcels/${parcel.id}/analyze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setParcel(data.parcel);
      setTab("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcels/${parcel.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          type: docType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setParcel(data.parcel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteDoc(docId: string) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/parcels/${parcel.id}/documents?docId=${docId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) setParcel(data.parcel);
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <IconShield className="h-4 w-4" /> },
    {
      key: "documents",
      label: "Documents",
      icon: <IconDoc className="h-4 w-4" />,
      badge: parcel.documents.length,
    },
    { key: "title", label: "Title Chain", icon: <IconChain className="h-4 w-4" /> },
    {
      key: "risk",
      label: "Risk Report",
      icon: <IconAlert className="h-4 w-4" />,
      badge: parcel.analysis?.riskFlags.length,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="px-1.5 text-slate-300">/</span>
        <span className="text-slate-700">{parcel.id}</span>
      </nav>

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">
                {parcel.parcelName}
              </h1>
              <StatusBadge status={parcel.status} />
              {parcel.analysis && <RiskBadge level={parcel.analysis.riskLevel} />}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Survey No. {parcel.surveyNumber} · {parcel.village}, {parcel.taluk},{" "}
              {parcel.district}, {parcel.state}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runAnalysis}
              disabled={analyzing || parcel.documents.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              title={
                parcel.documents.length === 0
                  ? "Upload at least one document first"
                  : undefined
              }
            >
              {analyzing ? (
                <>
                  <Spinner /> Analysing…
                </>
              ) : (
                <>
                  <IconShield className="h-4 w-4" />
                  {parcel.analysis ? "Re-run analysis" : "Run AI analysis"}
                </>
              )}
            </button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <Fact label="Extent" value={formatExtent(parcel.areaGuntas)} />
          <Fact label="Claimed owner" value={parcel.claimedOwner} />
          <Fact label="Documents" value={`${parcel.documents.length} on file`} />
          <Fact label="Last updated" value={formatDateTime(parcel.updatedAt)} />
        </dl>
        {parcel.purpose && (
          <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-100">
            <span className="font-medium text-slate-700">Purpose: </span>
            {parcel.purpose}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.icon}
            {t.label}
            {typeof t.badge === "number" && t.badge > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview parcel={parcel} onGoTo={setTab} />}
        {tab === "documents" && (
          <Documents
            parcel={parcel}
            busy={busy}
            docType={docType}
            setDocType={setDocType}
            fileRef={fileRef}
            onFilePicked={onFilePicked}
            onDelete={deleteDoc}
          />
        )}
        {tab === "title" && <TitleChain analysis={parcel.analysis} />}
        {tab === "risk" && <RiskReport analysis={parcel.analysis} />}
      </div>
    </div>
  );
}

function Overview({
  parcel,
  onGoTo,
}: {
  parcel: ParcelCase;
  onGoTo: (t: Tab) => void;
}) {
  if (!parcel.analysis) {
    return (
      <EmptyState
        icon={<IconShield className="h-6 w-6" />}
        title="No analysis yet"
        body="Upload the parcel's records and run the AI analysis to generate a title chain, encumbrance review and risk report."
        action={
          <button
            onClick={() => onGoTo("documents")}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Go to documents
          </button>
        }
      />
    );
  }
  const a = parcel.analysis;
  const meta = RISK_META[a.riskLevel];
  const criticalFlags = a.riskFlags.filter((f) =>
    ["high", "critical"].includes(f.severity)
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Executive summary
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {a.summary}
          </p>
          <div
            className={`mt-4 flex items-start gap-3 rounded-lg p-3 ring-1 ring-inset ${meta.bg} ${meta.ring}`}
          >
            <IconAlert className={`mt-0.5 h-5 w-5 shrink-0 ${meta.text}`} />
            <div>
              <div className={`text-sm font-semibold ${meta.text}`}>Verdict</div>
              <div className="text-sm text-slate-700">{a.verdict}</div>
            </div>
          </div>
        </div>

        {criticalFlags.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Top issues to resolve
              </h3>
              <button
                onClick={() => onGoTo("risk")}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View full report →
              </button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {criticalFlags.slice(0, 3).map((f) => {
                const m = RISK_META[f.severity];
                return (
                  <li key={f.id} className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {f.title}
                      </div>
                      <div className="text-xs text-slate-500">{f.detail}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <RiskGauge score={a.riskScore} level={a.riskLevel} />
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">At a glance</h3>
          <dl className="mt-3 space-y-2.5 text-sm">
            <Row label="Title transfers traced" value={String(a.titleChain.length)} />
            <Row
              label="Active encumbrances"
              value={String(a.encumbrances.filter((e) => e.status === "active").length)}
            />
            <Row label="Total risk flags" value={String(a.riskFlags.length)} />
            <Row
              label="Documents complete"
              value={`${a.checklist.filter((c) => c.present).length}/${a.checklist.length}`}
            />
            <Row label="Generated" value={formatDateTime(a.generatedAt)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const meta = RISK_META[level];
  const circumference = 2 * Math.PI * 52;
  const dash = (score / 100) * circumference;
  const color =
    level === "critical"
      ? "#dc2626"
      : level === "high"
      ? "#ea580c"
      : level === "medium"
      ? "#d97706"
      : "#059669";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Diligence risk score</h3>
      <div className="mt-2 flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{score}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              / 100
            </span>
          </div>
        </div>
        <div className={`mt-2 text-sm font-semibold ${meta.text}`}>
          {meta.label} risk
        </div>
        <p className="mt-1 text-center text-xs text-slate-400">
          Higher scores indicate greater title &amp; transaction risk.
        </p>
      </div>
    </div>
  );
}

function Documents({
  parcel,
  busy,
  docType,
  setDocType,
  fileRef,
  onFilePicked,
  onDelete,
}: {
  parcel: ParcelCase;
  busy: boolean;
  docType: DocumentType;
  setDocType: (t: DocumentType) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onFilePicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900">
            Records on file
          </h3>
        </div>
        {parcel.documents.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            No documents uploaded yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {parcel.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <IconDoc className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {d.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {DOCUMENT_LABELS[d.type]} · {d.sizeKb} KB
                  </div>
                </div>
                {d.analyzed && (
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:inline-flex">
                    <IconCheck className="h-3 w-3" /> Analysed
                  </span>
                )}
                <button
                  onClick={() => onDelete(d.id)}
                  disabled={busy}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label="Remove document"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Upload a record</h3>
        <p className="mt-1 text-xs text-slate-500">
          Classify the document, then choose a file. (Demo: file contents are not
          stored.)
        </p>
        <label className="mt-4 block text-xs font-medium text-slate-700">
          Document type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocumentType)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          {UPLOAD_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_LABELS[t]}
            </option>
          ))}
        </select>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40 disabled:opacity-60"
        >
          <IconUpload className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            {busy ? "Uploading…" : "Click to select a file"}
          </span>
          <span className="text-xs text-slate-400">PDF, JPG or PNG</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={onFilePicked}
        />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
