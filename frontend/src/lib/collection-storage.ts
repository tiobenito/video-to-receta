import { Collection } from "@/types/collection";

const STORAGE_KEY = "video-to-recipe-collections";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getCollections(): Collection[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Collection[];
  } catch {
    return [];
  }
}

function saveCollections(collections: Collection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export function createCollection(name: string, color?: string): Collection {
  const collections = getCollections();
  const newCollection: Collection = {
    id: generateId(),
    name,
    color,
    createdAt: new Date().toISOString(),
  };
  collections.push(newCollection);
  saveCollections(collections);
  return newCollection;
}

export function updateCollection(id: string, updates: Partial<Collection>): Collection | null {
  const collections = getCollections();
  const index = collections.findIndex((c) => c.id === id);
  if (index === -1) return null;

  collections[index] = { ...collections[index], ...updates };
  saveCollections(collections);
  return collections[index];
}

export function deleteCollection(id: string): void {
  const collections = getCollections().filter((c) => c.id !== id);
  saveCollections(collections);
}

export function getCollection(id: string): Collection | null {
  return getCollections().find((c) => c.id === id) || null;
}
