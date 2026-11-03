import { createClient } from "./supabase/client";
import { supabaseConfigured } from "./supabase/config";

export type MediaFormat = "post" | "story" | "cover";

export type SavedDesign = {
  id: string;
  title: string;
  format: MediaFormat;
  createdAt: number;
  image: Blob | string;
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
  image: Blob | string;
};

const databaseName = "samin-social-hub-media";
const mediaBucket = "samin-media";

async function workspaceContext() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Bitte melde dich an, um Inhalte zentral zu speichern.");
  const { data: membership, error } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (error) throw new Error("Dein Workspace ist nicht verfügbar. Bitte wende die Supabase-Migration an.");
  if (!membership) throw new Error("Für dieses Konto wurde noch kein Workspace erstellt.");
  return { supabase, user, workspaceId: membership.workspace_id as string };
}

function toLocalDateInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

async function saveRemoteMedia(design: SavedDesign) {
  const { supabase, user, workspaceId } = await workspaceContext();
  if (!(design.image instanceof Blob)) throw new Error("Die Grafikdatei ist nicht verfügbar.");
  const path = `${workspaceId}/${user.id}/${design.id}.png`;
  const { error: uploadError } = await supabase.storage.from(mediaBucket).upload(path, design.image, { contentType: "image/png", upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("media_assets").insert({
    workspace_id: workspaceId, created_by: user.id, title: design.title, format: design.format,
    storage_path: path, content_type: "image/png",
  }).select("id").single();
  if (error) {
    await supabase.storage.from(mediaBucket).remove([path]);
    throw error;
  }
  return { supabase, user, workspaceId, mediaId: data.id as string, path };
}

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
  if (supabaseConfigured) { await saveRemoteMedia(design); return; }
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = database.transaction("designs", "readwrite").objectStore("designs").put(design);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Der Entwurf konnte nicht gespeichert werden."));
  }).finally(() => database.close());
}

export async function savePost(post: LocalPost, design: SavedDesign): Promise<void> {
  if (supabaseConfigured) {
    const { supabase, user, workspaceId, mediaId, path } = await saveRemoteMedia(design);
    const cleanupMedia = async () => {
      await supabase.from("media_assets").delete().eq("id", mediaId).eq("workspace_id", workspaceId);
      await supabase.storage.from(mediaBucket).remove([path]);
    };
    const { data: client, error: clientError } = await supabase.from("clients").upsert({
      workspace_id: workspaceId, name: post.client, instagram_handle: post.handle,
    }, { onConflict: "workspace_id,name" }).select("id").single();
    if (clientError) { await cleanupMedia(); throw clientError; }
    const { error: assetError } = await supabase.from("media_assets").update({ client_id: client.id }).eq("id", mediaId).eq("workspace_id", workspaceId);
    if (assetError) { await cleanupMedia(); throw assetError; }
    const { error: postError } = await supabase.from("posts").insert({
      workspace_id: workspaceId, client_id: client.id, media_asset_id: mediaId, created_by: user.id,
      title: post.title, client_name: post.client, client_handle: post.handle, format: post.format,
      caption: post.caption, hashtags: post.hashtags,
      requested_at: post.wishDate ? new Date(post.wishDate).toISOString() : null,
      status: "draft",
    });
    if (postError) { await cleanupMedia(); throw postError; }
    return;
  }
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
  if (supabaseConfigured) {
    const { supabase, workspaceId } = await workspaceContext();
    const { data, error } = await supabase.from("media_assets").select("id,title,format,created_at,storage_path").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(24);
    if (error) throw error;
    return Promise.all((data ?? []).map(async (item) => {
      const { data: signed, error: signedError } = await supabase.storage.from(mediaBucket).createSignedUrl(item.storage_path, 3600);
      if (signedError) throw signedError;
      return { id: item.id, title: item.title, format: item.format as MediaFormat, createdAt: new Date(item.created_at).getTime(), image: signed.signedUrl };
    }));
  }
  const database = await openDatabase();
  return new Promise<SavedDesign[]>((resolve, reject) => {
    const request = database.transaction("designs", "readonly").objectStore("designs").getAll();
    request.onsuccess = () => resolve((request.result as SavedDesign[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error("Die Entwürfe konnten nicht geladen werden."));
  }).finally(() => database.close());
}

export async function getLocalPosts(): Promise<LocalPost[]> {
  if (supabaseConfigured) {
    const { supabase, workspaceId } = await workspaceContext();
    const { data, error } = await supabase.from("posts").select("id,title,client_name,client_handle,format,caption,hashtags,requested_at,created_at,status,media_asset_id").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    const mediaIds = [...new Set((data ?? []).map((post) => post.media_asset_id as string))];
    const { data: assets, error: assetsError } = mediaIds.length
      ? await supabase.from("media_assets").select("id,storage_path").in("id", mediaIds)
      : { data: [], error: null };
    if (assetsError) throw assetsError;
    const paths = new Map((assets ?? []).map((asset) => [asset.id as string, asset.storage_path as string]));
    return Promise.all((data ?? []).map(async (post) => {
      const path = paths.get(post.media_asset_id as string);
      if (!path) throw new Error("Eine Grafik dieses Beitrags wurde nicht gefunden.");
      const { data: signed, error: signedError } = await supabase.storage.from(mediaBucket).createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      return {
        id: post.id as string, designId: post.media_asset_id as string, title: post.title as string,
        client: post.client_name as string, handle: post.client_handle as string, format: post.format as MediaFormat,
        caption: post.caption as string, hashtags: post.hashtags as string, wishDate: toLocalDateInput(post.requested_at as string | null),
        status: "Entwurf" as const, createdAt: new Date(post.created_at as string).getTime(), image: signed.signedUrl,
      };
    }));
  }
  const database = await openDatabase();
  return new Promise<LocalPost[]>((resolve, reject) => {
    const request = database.transaction("posts", "readonly").objectStore("posts").getAll();
    request.onsuccess = () => resolve((request.result as LocalPost[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error("Die Beitragsentwürfe konnten nicht geladen werden."));
  }).finally(() => database.close());
}

export async function updateLocalPost(post: LocalPost): Promise<void> {
  if (supabaseConfigured) {
    const { supabase, workspaceId } = await workspaceContext();
    const { data: client, error: clientError } = await supabase.from("clients").upsert({
      workspace_id: workspaceId, name: post.client, instagram_handle: post.handle,
    }, { onConflict: "workspace_id,name" }).select("id").single();
    if (clientError) throw clientError;
    const { error: assetError } = await supabase.from("media_assets").update({ client_id: client.id }).eq("id", post.designId).eq("workspace_id", workspaceId);
    if (assetError) throw assetError;
    const { error } = await supabase.from("posts").update({
      client_id: client.id, client_name: post.client, client_handle: post.handle, title: post.title,
      caption: post.caption, hashtags: post.hashtags,
      requested_at: post.wishDate ? new Date(post.wishDate).toISOString() : null,
    }).eq("id", post.id).eq("workspace_id", workspaceId);
    if (error) throw error;
    return;
  }
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("posts", "readwrite");
    transaction.objectStore("posts").put(post);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Der Beitragsentwurf konnte nicht aktualisiert werden."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Die Aktualisierung wurde abgebrochen."));
  }).finally(() => database.close());
}
