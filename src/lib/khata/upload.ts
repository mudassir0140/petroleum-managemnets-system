import { MAX_PROOF_BYTES } from "./payments";

// Reads one uploaded proof image from a multipart request. The size is checked before the file is read,
// and the type is checked from the bytes afterwards (see validateProof).
export async function readProofUpload(request: Request): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; status: number; error: string }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_PROOF_BYTES + 64 * 1024) {
    return { ok: false, status: 413, error: "The image is larger than 3 MB" };
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { ok: false, status: 400, error: "Send the image as a file upload" };
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return { ok: false, status: 400, error: "Choose an image to upload" };
  if (file.size > MAX_PROOF_BYTES) return { ok: false, status: 413, error: "The image is larger than 3 MB" };
  return { ok: true, bytes: new Uint8Array(await file.arrayBuffer()) };
}
