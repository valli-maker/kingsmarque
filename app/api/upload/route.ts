// Uploads a single document to Anthropic's Files API and returns its file_id.
// Uses a direct HTTP call (not the SDK helper) so it works across SDK versions.
// One file per request keeps each request small; the total document set can be
// large because the chat references files by id rather than re-sending bytes.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FILES_BETA = "files-api-2025-04-14";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "The AI is not configured yet — add ANTHROPIC_API_KEY in Vercel and redeploy.",
      },
      { status: 200 }
    );
  }

  let file: File;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) {
      return Response.json({ error: "No file provided." }, { status: 400 });
    }
    file = f;
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }

  try {
    const out = new FormData();
    out.append("file", file, file.name);
    const res = await fetch("https://api.anthropic.com/v1/files", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": FILES_BETA,
      },
      body: out,
    });
    const data = await res.json();
    if (!res.ok) {
      const message =
        data?.error?.message ??
        `Upload failed (${res.status}). Please try again.`;
      return Response.json({ error: `Upload failed: ${message}` }, { status: 200 });
    }
    return Response.json({
      fileId: data.id,
      filename: file.name,
      mediaType: file.type,
    });
  } catch {
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 200 }
    );
  }
}
