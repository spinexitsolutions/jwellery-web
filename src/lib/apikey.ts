import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function generateKey() {
  const key = `kya_${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, 10), hash: hashKey(key) };
}

/** Validates the x-api-key header (or ?api_key=). Returns the key row when valid and scoped. */
export async function checkApiKey(req: Request, scope: "read" | "write") {
  const url = new URL(req.url);
  const key = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || url.searchParams.get("api_key");
  if (!key) return null;
  const row = await db.apiKey.findUnique({ where: { hash: hashKey(key) } });
  if (!row) return null;
  const scopes = row.scopes.split(",").map((s) => s.trim());
  if (!scopes.includes(scope) && !(scope === "read" && scopes.includes("write"))) return null;
  db.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return row;
}
