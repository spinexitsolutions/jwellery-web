import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string | null | undefined) {
  if (!md) return "";
  return marked.parse(md, { async: false }) as string;
}
