import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/titleReportPrompt";

// Real document reading + report drafting needs the full Node runtime (the
// Anthropic SDK), and can take a while to generate a long report.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FILES_BETA = "files-api-2025-04-14";

// Documents/images are referenced by Files API id (uploaded separately via
// /api/upload), so each chat request stays tiny regardless of document size.
type Block =
  | { type: "text"; text: string }
  | {
      type: "document" | "image";
      source: { type: "file"; file_id: string };
    };

interface InMessage {
  role: "user" | "assistant";
  content: string | Block[];
}

function plain(text: string): Response {
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return plain(
      "⚠️ The AI is not configured yet.\n\n" +
        "Add an environment variable named **ANTHROPIC_API_KEY** in your Vercel project " +
        "(Settings → Environment Variables), then redeploy. You can create a key at " +
        "console.anthropic.com. Once it's set, I'll be able to read documents and draft the title report."
    );
  }

  let messages: InMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return plain("⚠️ No messages received.");
    }
  } catch {
    return plain("⚠️ Could not read the request.");
  }

  // Beta header (enables referencing uploaded documents by file_id) is set as a
  // default header so the stream call takes a single argument.
  const client = new Anthropic({
    defaultHeaders: { "anthropic-beta": FILES_BETA },
  });
  type StreamParams = Parameters<typeof client.messages.stream>[0];

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Cache the large exemplar prompt so multi-turn chats stay cheap.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  } as unknown as StreamParams);

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg =
          err instanceof Anthropic.APIError
            ? `\n\n⚠️ API error (${err.status ?? ""}): ${err.message}`
            : `\n\n⚠️ Something went wrong while generating the response.`;
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
