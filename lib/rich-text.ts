// A deliberately tiny, safe markup for the popup body. Non-technical admins get
// bold, italic, links and bullet lists; nothing else is possible, and the output is a
// typed tree that React renders as elements (never as raw HTML), so there is no XSS surface.
//
//   **bold**   *italic*   [link text](https://example.org)   lines starting with "- " = bullets
//   A blank line starts a new paragraph; a single newline is a line break.

export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; c: Inline[] }
  | { t: "i"; c: Inline[] }
  | { t: "a"; href: string; c: Inline[] };

export type Block = { t: "p"; lines: Inline[][] } | { t: "ul"; items: Inline[][] };

/** Allowed link targets: http(s), mailto, tel, or a site-relative path. Blocks javascript:, data:, //host. */
export function isSafeHref(href: string): boolean {
  const v = href.trim();
  if (!v) return false;
  if (v.startsWith("/")) return !v.startsWith("//") && !v.includes("\\");
  try {
    const u = new URL(v);
    return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol);
  } catch {
    return false;
  }
}

const LINK_RE = /^\[([^\]\n]+)\]\(([^)\s]+)\)/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push({ t: "text", v: buf });
      buf = "";
    }
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === "*" && src[i + 1] === "*") {
      const j = src.indexOf("**", i + 2);
      if (j > i + 2) {
        flush();
        out.push({ t: "b", c: parseInline(src.slice(i + 2, j)) });
        i = j + 2;
        continue;
      }
    } else if (ch === "*") {
      // find a closing single "*" that is not half of a "**"
      let k = i + 1;
      let close = -1;
      while (k < src.length) {
        if (src[k] === "*" && src[k + 1] === "*") {
          k += 2;
        } else if (src[k] === "*") {
          close = k;
          break;
        } else {
          k += 1;
        }
      }
      if (close > i + 1) {
        flush();
        out.push({ t: "i", c: parseInline(src.slice(i + 1, close)) });
        i = close + 1;
        continue;
      }
    } else if (ch === "[") {
      const m = LINK_RE.exec(src.slice(i));
      if (m && isSafeHref(m[2])) {
        flush();
        out.push({ t: "a", href: m[2], c: parseInline(m[1]) });
        i += m[0].length;
        continue;
      }
    }

    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

export function parseBlocks(src: string): Block[] {
  const normalized = src.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const blocks: Block[] = [];
  for (const chunk of normalized.split(/\n[ \t]*\n+/)) {
    const lines = chunk.split("\n");
    let para: string[] = [];
    let list: string[] = [];
    const endPara = () => {
      if (para.length) blocks.push({ t: "p", lines: para.map(parseInline) });
      para = [];
    };
    const endList = () => {
      if (list.length) blocks.push({ t: "ul", items: list.map(parseInline) });
      list = [];
    };
    for (const line of lines) {
      const bullet = /^\s*-\s+(.*)$/.exec(line);
      if (bullet) {
        endPara();
        list.push(bullet[1]);
      } else if (line.trim()) {
        endList();
        para.push(line.trim());
      }
    }
    endPara();
    endList();
  }
  return blocks;
}

/** Plain-text rendering (used for the email-style summaries and tests). */
export function toPlainText(src: string): string {
  const flat = (nodes: Inline[]): string =>
    nodes.map((n) => (n.t === "text" ? n.v : flat(n.c))).join("");
  return parseBlocks(src)
    .map((b) => (b.t === "p" ? b.lines.map(flat).join("\n") : b.items.map((it) => `- ${flat(it)}`).join("\n")))
    .join("\n\n");
}
