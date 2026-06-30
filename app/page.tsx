import Link from "next/link";
import { listParcels } from "@/lib/db";
import { formatDate, formatExtent } from "@/lib/format";
import { RiskBadge, StatusBadge } from "@/components/Badges";
import {
  IconAlert,
  IconArrowRight,
  IconDoc,
  IconMap,
  IconPlus,
  IconShield,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const parcels = listParcels();
  const completed = parcels.filter((p) => p.status === "completed").length;
  const highRisk = parcels.filter(
    (p) => p.analysis && ["high", "critical"].includes(p.analysis.riskLevel)
  ).length;
  const totalGuntas = parcels.reduce((s, p) => s + p.areaGuntas, 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Due Diligence Portfolio
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            AI-assisted title verification and risk review across land parcels.
          </p>
        </div>
        <Link
          href="/parcels/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          <IconPlus className="h-4 w-4" />
          New Diligence
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Active Parcels"
          value={String(parcels.length)}
          icon={<IconMap className="h-5 w-5" />}
        />
        <Stat
          label="Reviews Completed"
          value={String(completed)}
          icon={<IconShield className="h-5 w-5" />}
        />
        <Stat
          label="High / Critical Risk"
          value={String(highRisk)}
          icon={<IconAlert className="h-5 w-5" />}
          accent={highRisk > 0 ? "text-orange-600" : undefined}
        />
        <Stat
          label="Extent Under Review"
          value={formatExtent(totalGuntas)}
          icon={<IconDoc className="h-5 w-5" />}
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">All Parcels</h2>
          <span className="text-xs text-slate-400">
            {parcels.length} record{parcels.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 md:grid">
          <div className="col-span-4">Parcel</div>
          <div className="col-span-2">Survey No.</div>
          <div className="col-span-2">Extent</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Risk</div>
        </div>

        <ul className="divide-y divide-slate-100">
          {parcels.map((p) => (
            <li key={p.id}>
              <Link
                href={`/parcels/${p.id}`}
                className="group grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-12 md:items-center"
              >
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {p.parcelName}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {p.village}, {p.taluk} · {p.district}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-slate-600">
                  <span className="md:hidden text-xs text-slate-400">Survey: </span>
                  {p.surveyNumber}
                </div>
                <div className="col-span-2 text-sm text-slate-600">
                  {formatExtent(p.areaGuntas)}
                </div>
                <div className="col-span-2">
                  <StatusBadge status={p.status} />
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2">
                  {p.analysis ? (
                    <RiskBadge level={p.analysis.riskLevel} />
                  ) : (
                    <span className="text-xs text-slate-400">Not analysed</span>
                  )}
                  <IconArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Generated assessments are decision-support only and do not constitute a
        legal title opinion.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-slate-300">{icon}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent ?? "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}
