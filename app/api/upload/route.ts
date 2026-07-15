import Anthropic, { toFile } from "@anthropic-ai/sdk";

// Uploads a single document to Anthropic's Files API and returns its file_id.
// Uploading one file per request keeps each request small (under the platform's
// per-request body limit) while the total document set can be large — the chat
// then references files by id instead of re-sending their bytes.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FILES_BETA = "files-api-2025-04-14";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
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

  const client = new Anthropic();
  try {
    const uploaded = await client.beta.files.upload(
      {
        file: await toFile(Buffer.from(await file.arrayBuffer()), file.name, {
          type: file.type || "application/octet-stream",
        }),
      },
      { headers: { "anthropic-beta": FILES_BETA } }
    );
    return Response.json({
      fileId: uploaded.id,
      filename: file.name,
      mediaType: file.type,
    });
  } catch (err) {
    const msg =
      err instanceof Anthropic.APIError
        ? `Upload failed (${err.status ?? ""}): ${err.message}`
        : "Upload failed. Please try again.";
    return Response.json({ error: msg }, { status: 200 });
  }
}
