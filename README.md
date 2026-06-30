# ParcelClear — Land Parcel Due Diligence

An AI-assisted due-diligence workspace for **land parcels in India**, modelled
on enterprise legal-AI platforms but specialised for title verification and
land risk review. Upload a parcel's records (sale deeds, encumbrance
certificates, RTC/Pahani, Khata, mutation extracts, survey sketches…), run an
analysis, and get a reconstructed **chain of title**, an **encumbrance review**,
a categorised **risk report**, and an overall **diligence risk score**.

> **Demo build.** The analysis engine is a deterministic mock (`lib/mockAnalysis.ts`)
> so the app runs fully offline with no API keys. It is structured to be swapped
> for a real Claude-powered document-extraction pipeline later.

## Features

- **Portfolio dashboard** — all parcels with status, extent and risk at a glance.
- **New diligence intake** — capture parcel particulars (survey no., village,
  taluk, district, owner, purpose).
- **Document workspace** — classify and "upload" records against a required-doc
  checklist; uploads invalidate stale analysis.
- **AI analysis (mock)** — derives a title chain, encumbrances, and risk flags
  across six categories: title, encumbrance, litigation, land use, survey and
  statutory.
- **Risk report** — severity-ranked findings with recommendations, document
  checklist, and a 0–100 risk gauge.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- File-backed JSON store (`data/store.json`, seeded from `lib/seed.ts`) — no
  database required for the demo.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The store is seeded with sample Karnataka parcels on
first run. Delete `data/store.json` to reset to seed data.

## Project layout

```
app/
  page.tsx                     Dashboard
  parcels/new/page.tsx         New diligence intake form
  parcels/[id]/page.tsx        Parcel workspace (server wrapper)
  api/parcels/...              REST endpoints (list/create/upload/analyze)
components/
  ParcelWorkspace.tsx          Tabbed workspace (overview/docs/title/risk)
  TitleChain.tsx               Chain-of-title timeline + encumbrances
  RiskReport.tsx               Risk findings + document checklist
lib/
  types.ts                     Domain model
  mockAnalysis.ts              Deterministic mock analysis engine
  db.ts / seed.ts              File-backed store + seed data
```

## Roadmap to production

- Replace `runMockAnalysis` with a real document-extraction pipeline (OCR +
  Claude) that reads uploaded PDFs.
- Swap the JSON store for Postgres/Prisma; add object storage for files.
- Authentication, organisations/teams, and audit trails.
- Multi-state revenue-record support beyond Karnataka.
- Exportable PDF diligence reports.

---

_Generated assessments are decision-support only and do not constitute a legal
title opinion._
