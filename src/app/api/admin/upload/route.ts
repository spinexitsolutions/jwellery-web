import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif", "video/mp4", "video/webm", "model/gltf-binary", "application/octet-stream"];

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No file" }, { status: 400 });
  const dir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  await mkdir(dir, { recursive: true });
  const out = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type) && !file.name.endsWith(".glb")) return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 15MB" }, { status: 400 });
    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
    const base = path.basename(file.name, path.extname(file.name)).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "file";
    const name = `${Date.now().toString(36)}-${base}${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    const media = await db.media.create({ data: { url: `/uploads/${name}`, name: file.name, type: file.type, size: file.size } });
    out.push(media);
  }
  return NextResponse.json({ files: out });
}
