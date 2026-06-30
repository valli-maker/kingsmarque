import { DiligenceAnalysis } from "@/lib/types";
import { IconChain } from "@/components/icons";
import EmptyState from "@/components/EmptyState";

export default function TitleChain({
  analysis,
}: {
  analysis: DiligenceAnalysis | null;
}) {
  if (!analysis) {
    return (
      <EmptyState
        icon={<IconChain className="h-6 w-6" />}
        title="Title chain not generated"
        body="Run the AI analysis to reconstruct the chain of title and surface any subsisting encumbrances."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Chain of title — Survey records
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Reconstructed from the registered instruments and mutation entries on
          file.
        </p>

        <ol className="mt-6 space-y-0">
          {analysis.titleChain.map((e, i) => {
            const last = i === analysis.titleChain.length - 1;
            return (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && (
                  <span className="absolute left-[15px] top-8 h-full w-px bg-slate-200" />
                )}
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                  {e.year}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-sm font-medium text-slate-800">
                    {e.from} <span className="text-slate-400">→</span> {e.to}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {e.instrument}
                  </div>
                  {e.remark && (
                    <div className="mt-1 inline-block rounded bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-100">
                      {e.remark}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Encumbrances</h3>
        <p className="mt-1 text-xs text-slate-500">
          As reflected in the Encumbrance Certificate.
        </p>
        {analysis.encumbrances.length === 0 ? (
          <div className="mt-5 rounded-lg bg-emerald-50 px-3 py-4 text-center text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            No encumbrances found for the period searched.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {analysis.encumbrances.map((e, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {e.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                      e.status === "active"
                        ? "bg-orange-50 text-orange-700 ring-orange-600/20"
                        : "bg-slate-100 text-slate-500 ring-slate-500/20"
                    }`}
                  >
                    {e.status === "active" ? "Active" : "Discharged"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {e.holder}
                  {e.amount ? ` · ${e.amount}` : ""}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{e.period}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
