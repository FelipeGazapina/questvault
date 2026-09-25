import { useMutation } from "convex/react";
import { useCallback } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  webp: "image/webp",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  caf: "audio/x-caf",
  "3gp": "audio/3gpp",
  webm: "audio/webm",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

/** Best guess at a local file's media type: explicit hint, then the blob's own type, then the extension. */
function contentTypeFor(uri: string, blob: Blob, hint?: string): string {
  if (hint) return hint;
  if (blob.type) return blob.type;
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(uri)?.[1]?.toLowerCase();
  return (ext && EXT_TYPES[ext]) || "application/octet-stream";
}

/**
 * Upload a local file (file://, content://, blob: or data: URI) to Convex storage.
 * Works on native and web: the file is read with fetch() and POSTed to a one-time upload URL.
 */
export async function uploadToConvex(uploadUrl: string, uri: string, contentType?: string): Promise<Id<"_storage">> {
  const blob = await (await fetch(uri)).blob();
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentTypeFor(uri, blob, contentType) },
    body: blob,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
  return storageId;
}

/** Returns `upload(uri, contentType?)` → storage id, fetching a fresh upload URL per file. */
export function useUpload() {
  const generateUploadUrl = useMutation(api.missions.generateUploadUrl);
  return useCallback(
    async (uri: string, contentType?: string) => uploadToConvex(await generateUploadUrl({}), uri, contentType),
    [generateUploadUrl],
  );
}
