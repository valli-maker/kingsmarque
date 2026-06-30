import { CaseStatus } from "./types";

// 40 guntas = 1 acre.
export function formatExtent(guntas: number): string {
  if (!guntas) return "—";
  const acres = Math.floor(guntas / 40);
  const rem = guntas % 40;
  const parts: string[] = [];
  if (acres) parts.push(`${acres} ac`);
  if (rem) parts.push(`${rem} g`);
  return parts.join(" ") || `${guntas} g`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_META: Record<
  CaseStatus,
  { label: string; classes: string }
> = {
  draft: { label: "Draft", classes: "bg-slate-100 text-slate-600 ring-slate-500/20" },
  in_review: {
    label: "In Review",
    classes: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  completed: {
    label: "Completed",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
};
