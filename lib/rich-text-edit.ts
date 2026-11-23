// Pure text-editing helpers behind the popup editor's formatting toolbar.
// Each takes the textarea value plus the current selection and returns the new value and selection.

export type EditResult = { value: string; start: number; end: number };
export type FormatKind = "bold" | "italic" | "bullets" | "link";

function wrap(value: string, s: number, e: number, open: string, close: string, placeholder: string): EditResult {
  const sel = value.slice(s, e);
  const inner = sel || placeholder;
  const next = value.slice(0, s) + open + inner + close + value.slice(e);
  return { value: next, start: s + open.length, end: s + open.length + inner.length };
}

function toggleBullets(value: string, s: number, e: number): EditResult {
  // Work on whole lines touched by the selection.
  const lineStart = value.lastIndexOf("\n", s - 1) + 1;
  const nl = value.indexOf("\n", e);
  const lineEnd = nl === -1 ? value.length : nl;
  const lines = value.slice(lineStart, lineEnd).split("\n");

  const content = lines.filter((l) => l.trim());
  const allBulleted = content.length > 0 && content.every((l) => /^\s*-\s/.test(l));

  const changed = lines
    .map((l) => {
      if (!l.trim()) return l;
      return allBulleted ? l.replace(/^(\s*)-\s+/, "$1") : /^\s*-\s/.test(l) ? l : `- ${l}`;
    })
    .join("\n");

  const next = value.slice(0, lineStart) + changed + value.slice(lineEnd);
  return { value: next, start: lineStart, end: lineStart + changed.length };
}

export function applyFormat(
  value: string,
  start: number,
  end: number,
  kind: FormatKind,
  url = "",
): EditResult {
  switch (kind) {
    case "bold":
      return wrap(value, start, end, "**", "**", "bold text");
    case "italic":
      return wrap(value, start, end, "*", "*", "italic text");
    case "link":
      return wrap(value, start, end, "[", `](${url})`, "link text");
    case "bullets":
      return toggleBullets(value, start, end);
  }
}
