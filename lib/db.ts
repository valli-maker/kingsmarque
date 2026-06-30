import fs from "fs";
import path from "path";
import { seedParcels } from "./seed";
import { ParcelCase } from "./types";

// Store strategy:
//   - Source of truth is an in-memory singleton held on globalThis, so it
//     survives hot reloads in dev and warm invocations on serverless hosts.
//   - Best-effort disk persistence to data/store.json when the filesystem is
//     writable (local dev). On read-only hosts (e.g. Vercel) the write is
//     skipped silently and the in-memory store is used instead.
// Swap this for Postgres/Prisma when real, durable multi-user persistence is
// needed.

interface Store {
  parcels: ParcelCase[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const globalRef = globalThis as unknown as { __parcelStore?: Store };

function persist(store: Store) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch {
    // Read-only filesystem (serverless) — in-memory store remains the source
    // of truth; nothing further to do.
  }
}

function load(): Store {
  if (globalRef.__parcelStore) return globalRef.__parcelStore;

  let store: Store | null = null;
  try {
    if (fs.existsSync(STORE_PATH)) {
      store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as Store;
    }
  } catch {
    store = null;
  }
  if (!store || !Array.isArray(store.parcels)) {
    store = { parcels: seedParcels() };
    persist(store);
  }

  globalRef.__parcelStore = store;
  return store;
}

export function listParcels(): ParcelCase[] {
  return [...load().parcels].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getParcel(id: string): ParcelCase | undefined {
  return load().parcels.find((p) => p.id === id);
}

export function createParcel(
  input: Omit<
    ParcelCase,
    "id" | "createdAt" | "updatedAt" | "documents" | "analysis" | "status"
  >
): ParcelCase {
  const store = load();
  const now = new Date().toISOString();
  const seq = 2072 + store.parcels.length;
  const parcel: ParcelCase = {
    ...input,
    id: `PCL-${seq}`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    documents: [],
    analysis: null,
  };
  store.parcels.push(parcel);
  persist(store);
  return parcel;
}

export function updateParcel(
  id: string,
  mutate: (p: ParcelCase) => ParcelCase
): ParcelCase | undefined {
  const store = load();
  const idx = store.parcels.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated = {
    ...mutate(store.parcels[idx]),
    updatedAt: new Date().toISOString(),
  };
  store.parcels[idx] = updated;
  persist(store);
  return updated;
}
