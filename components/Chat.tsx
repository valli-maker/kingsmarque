"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  IconClose,
  IconDoc,
  IconPaperclip,
  IconSend,
  IconShield,
  IconSparkles,
} from "@/components/icons";

type UploadStatus = "uploading" | "ready" | "error";

interface Attachment {
  id: string; // local id
  name: string;
  mediaType: string;
  sizeKb: number;
  status: UploadStatus;
  fileId?: string; // Anthropic Files API id, once uploaded
  error?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  attachments?: { name: string; sizeKb: number; fileId: string; mediaType: string }[];
}

// Anthropic content-block shape sent to the API (file references only).
type Block =
  | { type: "text"; text: string }
  | { type: "document" | "image"; source: { type: "file"; file_id: string } };

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp";
// Each individual file must stay under the platform's per-request body limit.
const MAX_FILE_BYTES = 4.4 * 1024 * 1024;

function isImage(t: string) {
  return ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(t);
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming, pending]);

  function updatePending(id: string, patch: Partial<Attachment>) {
    setPending((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function uploadOne(file: File, id: string) {
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.error || !data.fileId) {
        updatePending(id, { status: "error", error: data.error ?? "Upload failed" });
        return;
      }
      updatePending(id, { status: "ready", fileId: data.fileId });
    } catch {
      updatePending(id, { status: "error", error: "Upload failed" });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = "";
    setNotice(null);
    for (const f of files) {
      const id = `f${idCounter.current++}`;
      const base: Attachment = {
        id,
        name: f.name,
        mediaType: f.type || (f.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : ""),
        sizeKb: Math.max(1, Math.round(f.size / 1024)),
        status: "uploading",
      };
      if (f.size > MAX_FILE_BYTES) {
        setPending((p) => [
          ...p,
          { ...base, status: "error", error: "File too large (max ~4 MB each)" },
        ]);
        continue;
      }
      setPending((p) => [...p, base]);
      void uploadOne(f, id);
    }
  }

  function removePending(id: string) {
    setPending((p) => p.filter((a) => a.id !== id));
  }

  function buildBlocks(text: string, atts: { fileId: string; mediaType: string; name: string }[]): Block[] {
    const blocks: Block[] = [];
    for (const a of atts) {
      const isPdf = a.mediaType === "application/pdf" || a.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        blocks.push({ type: "document", source: { type: "file", file_id: a.fileId } });
      } else if (isImage(a.mediaType)) {
        blocks.push({ type: "image", source: { type: "file", file_id: a.fileId } });
      } else {
        blocks.push({ type: "document", source: { type: "file", file_id: a.fileId } });
      }
    }
    blocks.push({ type: "text", text: text || "Please review the attached document(s)." });
    return blocks;
  }

  const uploading = pending.some((a) => a.status === "uploading");

  async function send(promptText?: string) {
    const text = (promptText ?? input).trim();
    const ready = pending.filter((a) => a.status === "ready" && a.fileId);
    if ((!text && ready.length === 0) || streaming || uploading) return;

    const userMsg: ChatMessage = {
      role: "user",
      text,
      attachments: ready.map((a) => ({
        name: a.name,
        sizeKb: a.sizeKb,
        fileId: a.fileId!,
        mediaType: a.mediaType,
      })),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setPending([]);
    setStreaming(true);
    setNotice(null);

    const apiMessages = nextMessages.map((m) => {
      if (m.role === "user" && m.attachments && m.attachments.length > 0) {
        return { role: m.role, content: buildBlocks(m.text, m.attachments) };
      }
      return { role: m.role, content: m.text };
    });

    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            text: copy[copy.length - 1].text + chunk,
          };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          text:
            copy[copy.length - 1].text +
            "\n\n⚠️ The connection was interrupted. Please try again.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;
  const readyCount = pending.filter((a) => a.status === "ready").length;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="scroll-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {empty ? (
            <Welcome onPrompt={(p) => send(p)} hasFiles={readyCount > 0} />
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <Bubble
                  key={i}
                  message={m}
                  streaming={streaming && i === messages.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {notice && (
            <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
              {notice}
            </div>
          )}
          {pending.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pending.map((a) => (
                <span
                  key={a.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg py-1 pl-2 pr-1 text-xs ring-1 ring-inset ${
                    a.status === "error"
                      ? "bg-red-50 text-red-700 ring-red-600/20"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}
                >
                  {a.status === "uploading" ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                  ) : (
                    <IconDoc className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className="max-w-[180px] truncate" title={a.error ?? a.name}>
                    {a.name}
                  </span>
                  <button
                    onClick={() => removePending(a.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    aria-label="Remove"
                  >
                    <IconClose className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={streaming}
              className="mb-0.5 shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Attach documents"
              title="Attach documents (PDF, JPG, PNG)"
            >
              <IconPaperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={onPick}
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Upload the parcel's documents, or describe the property…"
              className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              onClick={() => send()}
              disabled={streaming || uploading || (!input.trim() && readyCount === 0)}
              className="mb-0.5 shrink-0 rounded-lg bg-brand-600 p-2 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
              title={uploading ? "Waiting for uploads to finish…" : "Send"}
            >
              <IconSend className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-slate-400">
            {uploading
              ? "Uploading documents…"
              : "AI-drafted title opinion for decision support — verify against the original records before relying on it."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm text-white">
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {message.attachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[11px]"
                >
                  <IconDoc className="h-3 w-3" />
                  <span className="max-w-[160px] truncate">{a.name}</span>
                </span>
              ))}
            </div>
          )}
          {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <IconShield className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {message.text ? (
          <div className="prose-report">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
          </div>
        ) : streaming ? (
          <div className="flex items-center gap-1.5 py-1 text-sm text-slate-400">
            <Dot /> <Dot /> <Dot /> reading &amp; drafting…
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Welcome({
  onPrompt,
  hasFiles,
}: {
  onPrompt: (p: string) => void;
  hasFiles: boolean;
}) {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
        <IconShield className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        Land Title Examination
      </h1>
      <p className="mt-1.5 max-w-md text-sm text-slate-500">
        Upload the parcel&apos;s documents — sale deeds, RTC/Pahani, Khata,
        mutation extracts, EC, survey records — and I&apos;ll trace the chain of
        title and draft a Title Report in your firm&apos;s format.
      </p>
      <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        <Suggestion
          icon={<IconSparkles className="h-4 w-4" />}
          title="Generate the title report"
          body="Once documents are attached"
          onClick={() =>
            onPrompt(
              "Please examine the attached documents, trace the chain of title, and generate the full Title Report (Property Description, List of Documents, Tracing of Title, Survey Records & Endorsement, Encumbrance Certificate, and Conclusion)."
            )
          }
          disabled={!hasFiles}
        />
        <Suggestion
          icon={<IconDoc className="h-4 w-4" />}
          title="What documents do you need?"
          body="Checklist for a clear opinion"
          onClick={() =>
            onPrompt(
              "What documents do you need from me to examine title and prepare a Title Report for a parcel of agricultural land in Karnataka?"
            )
          }
        />
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Tip: attach files with the paperclip (each up to ~4 MB), then ask me to
        generate the report.
      </p>
    </div>
  );
}

function Suggestion({
  icon,
  title,
  body,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="mt-0.5 text-brand-600">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{body}</span>
      </span>
    </button>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />;
}
