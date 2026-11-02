export type MediaFormat = "post" | "story" | "cover";

export type SavedDesign = {
  id: string;
  title: string;
  format: MediaFormat;
  createdAt: number;
  image: Blob;
};

export type LocalPost = {
  id: string;
  designId: string;
  title: string;
  client: string;
  handle: string;
  format: MediaFormat;
  caption: string;
  hashtags: string;
  wishDate: string;
  status: "Entwurf";
  createdAt: number;
  image: Blob;
};

const databaseName = "samin-social-hub-media";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("Dieser Browser unterstützt die lokale Medienablage nicht."));
    const request = indexedDB.open(databaseName, 2);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("designs")) database.createObjectStore("designs", { keyPath: "id" });
      if (!database.objectStoreNames.contains("posts")) database.createObjectStore("posts", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Die lokale Ablage konnte nicht geöffnet werden."));
  });
}

export async function saveDesign(design: SavedDesign): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction("designs", "readwrite").objectStore("designs").put(design);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Der Entwurf konnte nicht gespeichert werden."));
  }).finally(() => database.close());
}

export async function savePost(post: LocalPost, design: SavedDesign): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(["designs", "posts"], "readwrite");
    transaction.objectStore("designs").put(design);
    transaction.objectStore("posts").put(post);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Der Beitragsentwurf konnte nicht gespeichert werden."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Das Speichern des Beitrags wurde abgebrochen."));
  }).finally(() => database.close());
}

export async function getDesigns(): Promise<SavedDesign[]> {
  const database = await openDatabase();
  return new Promise<SavedDesign[]>((resolve, reject) => {
    const request = database.transaction("designs", "readonly").objectStore("designs").getAll();
    request.onsuccess = () => resolve((request.result as SavedDesign[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error("Die Entwürfe konnten nicht geladen werden."));
  }).finally(() => database.close());
}

export async function getLocalPosts(): Promise<LocalPost[]> {
  const database = await openDatabase();
  return new Promise<LocalPost[]>((resolve, reject) => {
    const request = database.transaction("posts", "readonly").objectStore("posts").getAll();
    request.onsuccess = () => resolve((request.result as LocalPost[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error("Die Beitragsentwürfe konnten nicht geladen werden."));
  }).finally(() => database.close());
}
