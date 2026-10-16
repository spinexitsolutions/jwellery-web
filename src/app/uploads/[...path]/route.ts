import { readFile, stat } from "fs/promises";
import path from "path";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".glb": "model/gltf-binary",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const root = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    await stat(file);
    const data = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const headers: Record<string, string> = { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" };
    if (ext === ".svg") headers["Content-Security-Policy"] = "script-src 'none'";
    return new Response(data, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
