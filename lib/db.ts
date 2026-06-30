import fs from "fs";
import path from "path";
import { seedParcels } from "./seed";
import { ParcelCase } from "./types";

// Simple file-backed JSON store. This keeps the MVP zero-dependency and
// inspectable; swap for a real database (Postgres/Prisma) when persistence
// and multi-tenancy are needed.

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

interface Store {
  parcels: ParcelCase[];
}

function ensureStore(): Store {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const initial: Store = { parcels: seedParcels() };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as Store;
  } catch {
    const initial: Store = { parcels: seedParcels() };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function write(store: Store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function listParcels(): ParcelCase[] {
  return ensureStore().parcels.sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getParcel(id: string): ParcelCase | undefined {
  return ensureStore().parcels.find((p) => p.id === id);
}

export function createParcel(
  input: Omit<
    ParcelCase,
    "id" | "createdAt" | "updatedAt" | "documents" | "analysis" | "status"
  >
): ParcelCase {
  const store = ensureStore();
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
  write(store);
  return parcel;
}

export function updateParcel(
  id: string,
  mutate: (p: ParcelCase) => ParcelCase
): ParcelCase | undefined {
  const store = ensureStore();
  const idx = store.parcels.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated = { ...mutate(store.parcels[idx]), updatedAt: new Date().toISOString() };
  store.parcels[idx] = updated;
  write(store);
  return updated;
}
