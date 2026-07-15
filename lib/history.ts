// Client-side history of past report sessions, persisted in the browser's
// localStorage. No backend needed; swap for a database when accounts land.

export interface StoredAttachment {
  name: string;
  sizeKb: number;
  fileId: string;
  mediaType: string;
}

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  attachments?: StoredAttachment[];
}

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
  messages: StoredMessage[];
}

const KEY = "parcelclear.sessions.v1";

function canUse(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadSessions(): Session[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Session[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveSession(session: Session): Session[] {
  if (!canUse()) return [];
  const all = loadSessions().filter((s) => s.id !== session.id);
  all.unshift(session);
  const trimmed = all.slice(0, 100); // keep the store bounded
  try {
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable — keep working in-memory.
  }
  return trimmed.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteSession(id: string): Session[] {
  if (!canUse()) return [];
  const all = loadSessions().filter((s) => s.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  return all;
}

export function titleFrom(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    if (firstUser.attachments && firstUser.attachments.length > 0) {
      const n = firstUser.attachments.length;
      return `${firstUser.attachments[0].name}${n > 1 ? ` +${n - 1} more` : ""}`;
    }
    if (firstUser.text) {
      return firstUser.text.slice(0, 60);
    }
  }
  return "Untitled report";
}
