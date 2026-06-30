// Domain model for land-parcel due diligence.

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type CaseStatus = "draft" | "in_review" | "completed";

// Document categories relevant to Indian land-title due diligence.
export type DocumentType =
  | "sale_deed"
  | "encumbrance_certificate"
  | "rtc_pahani"
  | "khata"
  | "mutation_extract"
  | "survey_sketch"
  | "tax_receipt"
  | "conversion_certificate"
  | "legal_heirship"
  | "litigation_record"
  | "other";

export interface DiligenceDocument {
  id: string;
  name: string;
  type: DocumentType;
  sizeKb: number;
  uploadedAt: string;
  // Set once the analysis engine has processed it.
  analyzed: boolean;
}

// A single transfer in the chain of title.
export interface TitleEvent {
  year: string;
  from: string;
  to: string;
  instrument: string; // e.g. "Sale Deed No. 1423/1998"
  remark?: string;
}

export interface Encumbrance {
  type: string; // Mortgage, Lien, Lease, Court Attachment...
  holder: string;
  amount?: string;
  status: "active" | "discharged";
  period: string;
}

export interface RiskFlag {
  id: string;
  category:
    | "title"
    | "encumbrance"
    | "litigation"
    | "land_use"
    | "survey"
    | "statutory";
  severity: RiskLevel;
  title: string;
  detail: string;
  recommendation: string;
}

export interface ChecklistItem {
  type: DocumentType;
  label: string;
  required: boolean;
  present: boolean;
}

export interface DiligenceAnalysis {
  generatedAt: string;
  riskScore: number; // 0-100, higher = riskier
  riskLevel: RiskLevel;
  verdict: string;
  summary: string;
  titleChain: TitleEvent[];
  encumbrances: Encumbrance[];
  riskFlags: RiskFlag[];
  checklist: ChecklistItem[];
}

export interface ParcelCase {
  id: string;
  parcelName: string;
  surveyNumber: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  areaGuntas: number; // recorded extent (in guntas; 40 guntas = 1 acre)
  claimedOwner: string;
  purpose: string; // e.g. "Acquisition for warehousing"
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  documents: DiligenceDocument[];
  analysis: DiligenceAnalysis | null;
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  sale_deed: "Sale / Title Deed",
  encumbrance_certificate: "Encumbrance Certificate (EC)",
  rtc_pahani: "RTC / Pahani (7-12 extract)",
  khata: "Khata Certificate & Extract",
  mutation_extract: "Mutation Register Extract",
  survey_sketch: "Survey Sketch / Tippani",
  tax_receipt: "Property Tax Receipts",
  conversion_certificate: "DC Conversion Certificate",
  legal_heirship: "Legal Heirship / Family Tree",
  litigation_record: "Litigation / Court Records",
  other: "Other Document",
};

export const RISK_META: Record<
  RiskLevel,
  { label: string; text: string; bg: string; ring: string; dot: string }
> = {
  low: {
    label: "Low",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    text: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-600/20",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    text: "text-orange-700",
    bg: "bg-orange-50",
    ring: "ring-orange-600/20",
    dot: "bg-orange-500",
  },
  critical: {
    label: "Critical",
    text: "text-red-700",
    bg: "bg-red-50",
    ring: "ring-red-600/20",
    dot: "bg-red-500",
  },
};
