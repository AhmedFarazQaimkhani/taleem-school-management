/**
 * File storage namespaced by schoolId: /tenants/{schoolId}/...
 * Swap LocalFileStorage for an S3 adapter without touching callers.
 */
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

export interface StoredFile {
  body: Buffer;
  contentType: string;
}

export interface FileStorage {
  put(schoolId: string, key: string, body: Buffer, contentType: string): Promise<string>;
  getUrl(schoolId: string, key: string): Promise<string>;
  read(schoolId: string, key: string): Promise<StoredFile>;
  remove(schoolId: string, key: string): Promise<void>;
}

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
}

function tenantKey(schoolId: string, key: string) {
  const safe = key.replace(/\\/g, "/").replace(/\.\./g, "").replace(/^\/+/, "");
  return `tenants/${schoolId}/${safe}`;
}

function resolvePath(schoolId: string, key: string) {
  const root = uploadRoot();
  const relative = tenantKey(schoolId, key);
  const full = path.resolve(root, relative);
  const allowed = path.resolve(root, "tenants", schoolId);
  if (full !== allowed && !full.startsWith(`${allowed}${path.sep}`)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

function contentTypeFromName(filePath: string, fallback: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return fallback;
}

export class LocalFileStorage implements FileStorage {
  async put(schoolId: string, key: string, body: Buffer, contentType: string): Promise<string> {
    const full = resolvePath(schoolId, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
    void contentType;
    return tenantKey(schoolId, key);
  }

  async getUrl(schoolId: string, key: string): Promise<string> {
    return `/${tenantKey(schoolId, key)}`;
  }

  async read(schoolId: string, key: string): Promise<StoredFile> {
    const full = resolvePath(schoolId, key);
    const body = await readFile(full);
    return { body, contentType: contentTypeFromName(full, "application/octet-stream") };
  }

  async remove(schoolId: string, key: string): Promise<void> {
    try {
      await unlink(resolvePath(schoolId, key));
    } catch {
      // missing file is fine — settings can still clear the key
    }
  }
}

export function getFileStorage(): FileStorage {
  return new LocalFileStorage();
}
