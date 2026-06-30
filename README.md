# ParcelClear — Land Title Examination

A chat-driven assistant that reads land documents and drafts a formal **Title
Examination Report (Title Opinion)** for immovable property in India, tuned for
Karnataka revenue and registration records.

You upload the parcel's documents — sale/partition deeds, RTC/Pahani, Khata,
mutation extracts, survey/Hissa records, Encumbrance Certificates, endorsements —
and the assistant (Claude Opus 4.8) reads them, traces the chain of title, asks
briefly for anything missing, and produces a report in the firm's house style:

1. **Property Description** (item-wise: survey no., extent in Acres/Guntas, village/hobli/taluk, boundaries)
2. **I. List of Documents Furnished** (numbered table)
3. **II. Tracing of the Title** (chronological numbered paragraphs citing each document)
4. **III. Survey Records and Endorsement**
5. **Encumbrance Certificate**
6. **Conclusion** (the title opinion)

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Claude Opus 4.8** via `@anthropic-ai/sdk` — native PDF/image reading, streamed responses
- `react-markdown` + `remark-gfm` for rendering the report (tables, headings)

## Configuration

The app needs an Anthropic API key, read from the `ANTHROPIC_API_KEY`
environment variable.

- **Local:** create a `.env.local` with `ANTHROPIC_API_KEY=sk-ant-...`
- **Vercel:** add `ANTHROPIC_API_KEY` under Settings → Environment Variables, then redeploy.

Create a key at [console.anthropic.com](https://console.anthropic.com). Without
a key, the chat replies with setup instructions instead of failing.

## Getting started

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev   # http://localhost:3000
```

## How it works

- `lib/titleReportPrompt.ts` — the system prompt: report structure, drafting
  conventions, accuracy rules, and a gold-standard exemplar in the firm's style.
- `app/api/chat/route.ts` — streams Claude's response; uploaded PDFs/images are
  passed as native document/image content blocks so the model reads them directly.
- `components/Chat.tsx` — the chat UI (upload, stream, render the report).

## Known limitations / roadmap

- **Upload size:** serverless requests are capped (~4 MB on Vercel Hobby), so very
  large scanned files won't send. Production path: direct-to-storage upload +
  the Anthropic Files API (`file_id` references) instead of inline base64.
- **No persistence yet:** each conversation lives in the browser session. Saving
  reports, a portfolio view, and PDF/DOCX export are natural next steps.
- **Verification:** output is decision-support drafting, not a substitute for a
  signed opinion by an advocate — always check against the original records.
