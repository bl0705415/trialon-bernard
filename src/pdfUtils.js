import { pdf } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://rxepavvxustsikfsilpc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXBhdnZ4dXN0c2lrZnNpbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwOTIzMDYsImV4cCI6MjA5MDY2ODMwNn0.zLO00rby8ji5GzWcfNXwIjuUZ79Ee3sxSJH1m7EQ7Es"
);

const BUCKET = "study-pdfs";

// ─── In-memory cache: studyId → { docId → blobUrl } ────────────────────────
const _urlCache  = new Map(); // studyId → Map<docId, string>
const _blobCache = new Map(); // studyId → Map<docId, Blob>

/**
 * Remove all cached PDF URLs for a study.
 */
export function invalidateStudyCache(studyId) {
  const urls = _urlCache.get(studyId);
  if (urls) {
    urls.forEach((url) => URL.revokeObjectURL(url));
    _urlCache.delete(studyId);
  }
  _blobCache.delete(studyId);

  // Also delete from Supabase Storage so stale PDFs aren't served
  ["irb", "consent", "cta"].forEach(docId => {
    supabase.storage.from(BUCKET).remove([`${studyId}/${docId}.pdf`]);
  });
}

/**
 * Get the public Supabase Storage URL for a PDF if it already exists.
 */
async function getStorageUrl(studyId, docId) {
  const path = `${studyId}/${docId}.pdf`;
  const { data } = await supabase.storage.from(BUCKET).list(studyId, {
    search: `${docId}.pdf`
  });
  if (data && data.length > 0) {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return urlData?.publicUrl || null;
  }
  return null;
}

/**
 * Upload a PDF blob to Supabase Storage.
 */
async function uploadToStorage(studyId, docId, blob) {
  const path = `${studyId}/${docId}.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "application/pdf",
    upsert: true, // overwrite if exists
  });
  if (error) {
    console.error("Storage upload error:", error.message);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * Generate a PDF blob lazily, upload to Supabase Storage, and cache it.
 * On subsequent calls, returns the Supabase Storage public URL directly.
 */
export async function getPdfUrl(studyId, docId, docElement) {
  // 1. Return in-memory cached URL if available (fastest)
  const studyUrls = _urlCache.get(studyId);
  if (studyUrls?.has(docId)) {
    return studyUrls.get(docId);
  }

  // 2. Check if already uploaded to Supabase Storage
  const storageUrl = await getStorageUrl(studyId, docId);
  if (storageUrl) {
    // Cache it in memory for this session
    if (!_urlCache.has(studyId)) _urlCache.set(studyId, new Map());
    _urlCache.get(studyId).set(docId, storageUrl);
    return storageUrl;
  }

  // 3. Generate blob, upload to Storage, cache locally
  const blob = await pdf(docElement).toBlob();
  const publicUrl = await uploadToStorage(studyId, docId, blob);

  // Fall back to local blob URL if upload fails
  const url = publicUrl || URL.createObjectURL(blob);

  if (!_urlCache.has(studyId))  _urlCache.set(studyId, new Map());
  if (!_blobCache.has(studyId)) _blobCache.set(studyId, new Map());
  _urlCache.get(studyId).set(docId, url);
  _blobCache.get(studyId).set(docId, blob);

  return url;
}

/**
 * Trigger a browser download. Uses cached blob or fetches from Storage.
 */
export async function downloadPdf(studyId, docId, fileName, docElement) {
  // Try cached blob first
  const studyBlobs = _blobCache.get(studyId);
  let blob = studyBlobs?.get(docId);

  if (!blob) {
    // Try fetching from Supabase Storage
    const storageUrl = await getStorageUrl(studyId, docId);
    if (storageUrl) {
      const res = await fetch(storageUrl);
      blob = await res.blob();
    } else {
      // Generate fresh
      blob = await pdf(docElement).toBlob();
      await uploadToStorage(studyId, docId, blob);
    }

    if (!_blobCache.has(studyId)) _blobCache.set(studyId, new Map());
    _blobCache.get(studyId).set(docId, blob);
  }

  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** @deprecated Use getPdfUrl() with a studyId instead. */
export async function makePdfUrl(docElement) {
  const blob = await pdf(docElement).toBlob();
  return URL.createObjectURL(blob);
}