import { RISK_META, RiskLevel } from "@/lib/types";
import { STATUS_META } from "@/lib/format";
import { CaseStatus } from "@/lib/types";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const m = RISK_META[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${m.bg} ${m.text} ${m.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label} Risk
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${m.classes}`}
    >
      {m.label}
    </span>
  );
}
