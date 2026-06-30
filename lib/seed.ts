import { runMockAnalysis } from "./mockAnalysis";
import { DiligenceDocument, DocumentType, ParcelCase } from "./types";

function doc(
  id: string,
  name: string,
  type: DocumentType,
  sizeKb: number,
  uploadedAt: string
): DiligenceDocument {
  return { id, name, type, sizeKb, uploadedAt, analyzed: true };
}

function withAnalysis(p: ParcelCase): ParcelCase {
  return { ...p, analysis: p.status === "draft" ? null : runMockAnalysis(p) };
}

export function seedParcels(): ParcelCase[] {
  const base: ParcelCase[] = [
    {
      id: "PCL-2041",
      parcelName: "Doddaballapura Industrial Plot",
      surveyNumber: "112/2B",
      village: "Bashettihalli",
      taluk: "Doddaballapura",
      district: "Bengaluru Rural",
      state: "Karnataka",
      areaGuntas: 240,
      claimedOwner: "Sri Mahesh Gowda S/o Late Ramaiah",
      purpose: "Acquisition for warehousing & logistics park",
      status: "completed",
      createdAt: "2026-05-18T09:12:00.000Z",
      updatedAt: "2026-06-21T14:30:00.000Z",
      documents: [
        doc("d1", "Sale_Deed_1998_1423.pdf", "sale_deed", 1840, "2026-05-18T09:20:00.000Z"),
        doc("d2", "EC_2003_2026.pdf", "encumbrance_certificate", 920, "2026-05-18T09:21:00.000Z"),
        doc("d3", "RTC_112-2B.pdf", "rtc_pahani", 410, "2026-05-18T09:22:00.000Z"),
        doc("d4", "Khata_Extract.pdf", "khata", 280, "2026-05-19T11:02:00.000Z"),
        doc("d5", "Mutation_MR-88-04.pdf", "mutation_extract", 350, "2026-05-19T11:03:00.000Z"),
        doc("d6", "Tippani_Sketch.pdf", "survey_sketch", 600, "2026-05-20T10:00:00.000Z"),
      ],
      analysis: null,
    },
    {
      id: "PCL-2052",
      parcelName: "Whitefield Residential Layout — Site 14",
      surveyNumber: "45/1",
      village: "Kadugodi",
      taluk: "Bengaluru East",
      district: "Bengaluru Urban",
      state: "Karnataka",
      areaGuntas: 36,
      claimedOwner: "Smt. Lakshmi Reddy W/o Sri Suresh Reddy",
      purpose: "Title verification prior to home loan disbursal",
      status: "in_review",
      createdAt: "2026-06-10T07:45:00.000Z",
      updatedAt: "2026-06-26T16:10:00.000Z",
      documents: [
        doc("d1", "Sale_Deed_2015.pdf", "sale_deed", 1320, "2026-06-10T07:50:00.000Z"),
        doc("d2", "EC_2008_2026.pdf", "encumbrance_certificate", 880, "2026-06-10T07:51:00.000Z"),
        doc("d3", "Khata_Certificate.pdf", "khata", 240, "2026-06-11T09:30:00.000Z"),
      ],
      analysis: null,
    },
    {
      id: "PCL-2068",
      parcelName: "Mysuru Ring Road Agricultural Land",
      surveyNumber: "78",
      village: "Hootagalli",
      taluk: "Mysuru",
      district: "Mysuru",
      state: "Karnataka",
      areaGuntas: 520,
      claimedOwner: "Sri Devaraj Naik S/o Sri Krishnappa",
      purpose: "Pre-purchase due diligence — solar farm development",
      status: "completed",
      createdAt: "2026-04-02T12:00:00.000Z",
      updatedAt: "2026-06-15T08:20:00.000Z",
      documents: [
        doc("d1", "Sale_Deed_2009.pdf", "sale_deed", 1500, "2026-04-02T12:05:00.000Z"),
        doc("d2", "RTC_78.pdf", "rtc_pahani", 420, "2026-04-02T12:06:00.000Z"),
        doc("d3", "Mutation.pdf", "mutation_extract", 360, "2026-04-03T10:00:00.000Z"),
        doc("d4", "Family_Tree.pdf", "legal_heirship", 210, "2026-04-04T15:00:00.000Z"),
      ],
      analysis: null,
    },
    {
      id: "PCL-2071",
      parcelName: "Hosur Highway Commercial Frontage",
      surveyNumber: "203/4",
      village: "Attibele",
      taluk: "Anekal",
      district: "Bengaluru Urban",
      state: "Karnataka",
      areaGuntas: 88,
      claimedOwner: "M/s Sterling Estates Pvt. Ltd.",
      purpose: "Joint development agreement — retail",
      status: "draft",
      createdAt: "2026-06-28T06:30:00.000Z",
      updatedAt: "2026-06-28T06:30:00.000Z",
      documents: [],
      analysis: null,
    },
  ];

  return base.map(withAnalysis);
}
