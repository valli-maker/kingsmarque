import {
  ChecklistItem,
  DiligenceAnalysis,
  DOCUMENT_LABELS,
  DocumentType,
  Encumbrance,
  ParcelCase,
  RiskFlag,
  RiskLevel,
  TitleEvent,
} from "./types";

// Deterministic pseudo-random generator so re-running analysis on the same
// parcel yields stable output (no real AI / network call in this build).
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const REQUIRED_DOCS: DocumentType[] = [
  "sale_deed",
  "encumbrance_certificate",
  "rtc_pahani",
  "khata",
  "mutation_extract",
];

const OPTIONAL_DOCS: DocumentType[] = [
  "survey_sketch",
  "tax_receipt",
  "conversion_certificate",
  "legal_heirship",
  "litigation_record",
];

function buildChecklist(parcel: ParcelCase): ChecklistItem[] {
  const present = new Set(parcel.documents.map((d) => d.type));
  return [...REQUIRED_DOCS, ...OPTIONAL_DOCS].map((type) => ({
    type,
    label: DOCUMENT_LABELS[type],
    required: REQUIRED_DOCS.includes(type),
    present: present.has(type),
  }));
}

function buildTitleChain(parcel: ParcelCase, rand: () => number): TitleEvent[] {
  const surnames = [
    "Gowda",
    "Reddy",
    "Patil",
    "Shetty",
    "Naik",
    "Rao",
    "Iyer",
    "Hegde",
  ];
  const pick = () => surnames[Math.floor(rand() * surnames.length)];
  const chain: TitleEvent[] = [];
  let owner = `${pick()} family`;
  let year = 1972 + Math.floor(rand() * 8);
  const transfers = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < transfers; i++) {
    const next =
      i === transfers - 1 ? parcel.claimedOwner : `Sri ${pick()} S/o ${pick()}`;
    const instruments = [
      "Sale Deed",
      "Gift Deed",
      "Partition Deed",
      "Release Deed",
    ];
    const instrument = instruments[Math.floor(rand() * instruments.length)];
    const docNo = 100 + Math.floor(rand() * 8000);
    chain.push({
      year: String(year),
      from: owner,
      to: next,
      instrument: `${instrument} No. ${docNo}/${year}`,
      remark:
        i === 0 ? "Earliest available record (root of title)" : undefined,
    });
    owner = next;
    year += 4 + Math.floor(rand() * 10);
    if (year > 2024) year = 2024;
  }
  return chain;
}

function buildEncumbrances(rand: () => number): Encumbrance[] {
  const out: Encumbrance[] = [];
  if (rand() > 0.45) {
    const banks = [
      "State Bank of India",
      "Canara Bank",
      "HDFC Bank",
      "Union Bank",
    ];
    const active = rand() > 0.5;
    out.push({
      type: "Mortgage (Deposit of Title Deeds)",
      holder: banks[Math.floor(rand() * banks.length)],
      amount: `₹${(15 + Math.floor(rand() * 60)).toFixed(0)} Lakh`,
      status: active ? "active" : "discharged",
      period: active ? "2019 – present" : "2011 – 2017",
    });
  }
  if (rand() > 0.7) {
    out.push({
      type: "Court Attachment",
      holder: "Civil Court, District",
      status: "active",
      period: "2021 – present",
    });
  }
  return out;
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 22) return "medium";
  return "low";
}

export function runMockAnalysis(parcel: ParcelCase): DiligenceAnalysis {
  const rand = seededRandom(parcel.id + parcel.documents.length);
  const checklist = buildChecklist(parcel);
  const titleChain = buildTitleChain(parcel, rand);
  const encumbrances = buildEncumbrances(rand);

  const flags: RiskFlag[] = [];
  let score = 8; // baseline

  // Missing-document flags.
  const missingRequired = checklist.filter((c) => c.required && !c.present);
  for (const m of missingRequired) {
    score += 12;
    flags.push({
      id: `missing_${m.type}`,
      category: "statutory",
      severity: "high",
      title: `${m.label} not on record`,
      detail: `No ${m.label} was uploaded for this parcel. This is a mandatory document for establishing clear title and statutory compliance.`,
      recommendation: `Obtain the ${m.label} from the concerned sub-registrar / revenue office before proceeding.`,
    });
  }

  // Active encumbrance flag.
  const activeEnc = encumbrances.filter((e) => e.status === "active");
  for (const e of activeEnc) {
    const critical = e.type.includes("Attachment");
    score += critical ? 22 : 14;
    flags.push({
      id: `enc_${e.type}`,
      category: critical ? "litigation" : "encumbrance",
      severity: critical ? "critical" : "high",
      title: critical
        ? "Subsisting court attachment on the property"
        : `Active mortgage in favour of ${e.holder}`,
      detail: critical
        ? "The Encumbrance Certificate reflects a subsisting court attachment. The property cannot be transferred free of this charge until vacated."
        : `An active mortgage (${e.amount ?? ""}) created by deposit of title deeds is subsisting. The property is charged to ${e.holder}.`,
      recommendation: critical
        ? "Verify the underlying suit and obtain a certified copy of any order vacating the attachment."
        : "Insist on a no-dues / discharge certificate and registered release of mortgage before completion.",
    });
  }

  // Title-chain continuity check.
  if (rand() > 0.6) {
    score += 16;
    flags.push({
      id: "title_gap",
      category: "title",
      severity: "high",
      title: "Gap in chain of title",
      detail:
        "The recorded transfers show an unexplained interval where ownership cannot be traced through a registered instrument. A break in the chain weakens marketability of title.",
      recommendation:
        "Reconstruct the missing link via certified copies of intervening deeds or a registered declaration; consider title indemnity.",
    });
  }

  // Survey / extent mismatch.
  if (rand() > 0.62) {
    score += 9;
    flags.push({
      id: "extent_mismatch",
      category: "survey",
      severity: "medium",
      title: "Extent mismatch between deed and revenue records",
      detail: `The extent recorded in the title deed differs from the area shown in the RTC for Survey No. ${parcel.surveyNumber}. Discrepancies of this kind often indicate sub-division or encroachment.`,
      recommendation:
        "Commission a licensed surveyor to reconcile boundaries against the tippani/akarband and confirm physical possession.",
    });
  }

  // Land-use / conversion.
  if (!checklist.find((c) => c.type === "conversion_certificate")?.present) {
    score += 10;
    flags.push({
      id: "land_use",
      category: "land_use",
      severity: "medium",
      title: "Agricultural classification — conversion not evidenced",
      detail:
        "No DC conversion order is on record. If the parcel remains classified as agricultural, non-agricultural use (and purchase by non-agriculturists in some states) may be restricted.",
      recommendation:
        "Confirm the land-use classification in the RTC and obtain the conversion (NA) order for the intended purpose.",
    });
  }

  // Pending litigation (random).
  if (rand() > 0.75) {
    score += 18;
    flags.push({
      id: "litigation_pending",
      category: "litigation",
      severity: "high",
      title: "Pending litigation touching the property",
      detail:
        "A search suggests a pending civil proceeding in respect of the schedule property or an adjoining parcel. Lis pendens may bind a purchaser.",
      recommendation:
        "Obtain certified copies of the plaint and latest order sheet; assess the risk of an adverse decree before completion.",
    });
  }

  score = Math.min(96, score);
  const riskLevel = levelFromScore(score);

  const verdictMap: Record<RiskLevel, string> = {
    low: "Title appears marketable — proceed with standard safeguards.",
    medium: "Conditionally proceed — resolve the flagged items before completion.",
    high: "Caution — material defects identified; do not complete until cured.",
    critical: "Do not proceed — fundamental title / encumbrance defects present.",
  };

  const summary =
    `Automated review of ${parcel.documents.length} document(s) for ${parcel.parcelName} ` +
    `(Survey No. ${parcel.surveyNumber}, ${parcel.village}, ${parcel.district}). ` +
    `${flags.length} issue(s) flagged across title, encumbrance, survey and statutory checks. ` +
    `The chain of title has been traced through ${titleChain.length} transfer(s). ` +
    `Overall diligence risk is assessed as ${riskLevel.toUpperCase()}.`;

  return {
    generatedAt: new Date().toISOString(),
    riskScore: score,
    riskLevel,
    verdict: verdictMap[riskLevel],
    summary,
    titleChain,
    encumbrances,
    riskFlags: flags.sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity)
    ),
    checklist,
  };
}

function severityRank(s: RiskLevel): number {
  return { low: 0, medium: 1, high: 2, critical: 3 }[s];
}
