import { DiligenceAnalysis, RISK_META, RiskFlag } from "@/lib/types";
import { IconAlert, IconCheck } from "@/components/icons";
import EmptyState from "@/components/EmptyState";

const CATEGORY_LABELS: Record<RiskFlag["category"], string> = {
  title: "Title",
  encumbrance: "Encumbrance",
  litigation: "Litigation",
  land_use: "Land Use",
  survey: "Survey",
  statutory: "Statutory",
};

export default function RiskReport({
  analysis,
}: {
  analysis: DiligenceAnalysis | null;
}) {
  if (!analysis) {
    return (
      <EmptyState
        icon={<IconAlert className="h-6 w-6" />}
        title="No risk report yet"
        body="Run the AI analysis to evaluate title, encumbrance, survey, litigation and statutory risk for this parcel."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Risk findings
          </h3>
          <span className="text-xs text-slate-400">
            {analysis.riskFlags.length} flag
            {analysis.riskFlags.length === 1 ? "" : "s"}
          </span>
        </div>

        {analysis.riskFlags.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            No material risks were identified in the records reviewed.
          </div>
        ) : (
          analysis.riskFlags.map((f) => {
            const m = RISK_META[f.severity];
            return (
              <div
                key={f.id}
                className={`rounded-xl border border-slate-200 bg-white p-4`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.bg} ${m.text}`}
                  >
                    <IconAlert className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {f.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${m.bg} ${m.text} ${m.ring}`}
                      >
                        {m.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {CATEGORY_LABELS[f.category]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{f.detail}</p>
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        Recommendation:
                      </span>
                      <span>{f.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Document checklist
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Required records for a clear-title opinion.
          </p>
          <ul className="mt-3 space-y-2">
            {analysis.checklist.map((c) => (
              <li key={c.type} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    c.present
                      ? "bg-emerald-100 text-emerald-700"
                      : c.required
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {c.present ? (
                    <IconCheck className="h-3 w-3" />
                  ) : (
                    <span className="text-[11px] leading-none">—</span>
                  )}
                </span>
                <span
                  className={`flex-1 ${
                    c.present ? "text-slate-700" : "text-slate-500"
                  }`}
                >
                  {c.label}
                </span>
                {c.required && !c.present && (
                  <span className="text-[11px] font-medium text-red-600">
                    Missing
                  </span>
                )}
                {!c.required && (
                  <span className="text-[11px] text-slate-400">Optional</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          <strong className="font-semibold">Disclaimer.</strong> This automated
          assessment is generated by a demonstration model for decision support
          only. It is not a legal opinion and should be confirmed by a qualified
          advocate before any transaction.
        </div>
      </div>
    </div>
  );
}
