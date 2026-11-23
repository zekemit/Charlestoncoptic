import { describe, expect, it } from "vitest";
import { applyFormat } from "@/lib/rich-text-edit";
import { isSafeHref, parseBlocks, parseInline, toPlainText } from "@/lib/rich-text";

describe("isSafeHref", () => {
  it.each(["https://example.org", "http://example.org/a?b=1", "mailto:a@b.co", "tel:+18434371255", "/donate", "/visit-us#map"])(
    "allows %s",
    (v) => expect(isSafeHref(v)).toBe(true),
  );
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x</b>", "//evil.example", "/\\evil.example", "", "   ", "ftp://x.y", "vbscript:x"])(
    "blocks %j",
    (v) => expect(isSafeHref(v)).toBe(false),
  );
});

describe("parseInline", () => {
  it("parses bold, italic and links", () => {
    expect(parseInline("a **b** *c* [d](https://x.org)")).toEqual([
      { t: "text", v: "a " },
      { t: "b", c: [{ t: "text", v: "b" }] },
      { t: "text", v: " " },
      { t: "i", c: [{ t: "text", v: "c" }] },
      { t: "text", v: " " },
      { t: "a", href: "https://x.org", c: [{ t: "text", v: "d" }] },
    ]);
  });

  it("nests italic inside bold", () => {
    expect(parseInline("**a *b* c**")).toEqual([
      { t: "b", c: [{ t: "text", v: "a " }, { t: "i", c: [{ t: "text", v: "b" }] }, { t: "text", v: " c" }] },
    ]);
  });

  it("leaves unmatched markers as plain text", () => {
    expect(toPlainText("2 * 3 and **open")).toBe("2 * 3 and **open");
  });

  it("refuses unsafe link targets and keeps the text visible", () => {
    const out = parseInline("[click](javascript:alert(1))");
    expect(out.some((n) => n.t === "a")).toBe(false);
    expect(toPlainText("[click](javascript:alert(1))")).toContain("click");
  });

  it("never produces HTML: markup characters stay inert text", () => {
    const out = parseInline("<script>alert(1)</script> <img src=x onerror=y>");
    expect(out).toEqual([{ t: "text", v: "<script>alert(1)</script> <img src=x onerror=y>" }]);
  });
});

describe("parseBlocks", () => {
  it("splits paragraphs on blank lines and keeps single newlines as line breaks", () => {
    const b = parseBlocks("one\ntwo\n\nthree");
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ t: "p" });
    expect((b[0] as { lines: unknown[] }).lines).toHaveLength(2);
  });

  it("turns '- ' lines into a list, even directly after a paragraph line", () => {
    const b = parseBlocks("Bring:\n- food\n- chairs");
    expect(b.map((x) => x.t)).toEqual(["p", "ul"]);
    expect((b[1] as { items: unknown[] }).items).toHaveLength(2);
  });

  it("handles empty and whitespace-only input", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("  \n \n")).toEqual([]);
  });

  it("normalizes Windows line endings", () => {
    expect(parseBlocks("a\r\n\r\nb")).toHaveLength(2);
  });
});

describe("applyFormat (toolbar)", () => {
  it("wraps the selection in bold markers and keeps the selection on the inner text", () => {
    const r = applyFormat("hello world", 6, 11, "bold");
    expect(r.value).toBe("hello **world**");
    expect(r.value.slice(r.start, r.end)).toBe("world");
  });

  it("inserts a placeholder when nothing is selected", () => {
    const r = applyFormat("", 0, 0, "italic");
    expect(r.value).toBe("*italic text*");
    expect(r.value.slice(r.start, r.end)).toBe("italic text");
  });

  it("builds a link around the selection", () => {
    const r = applyFormat("see our page", 8, 12, "link", "/visit-us");
    expect(r.value).toBe("see our [page](/visit-us)");
  });

  it("toggles bullets on whole lines, on and off", () => {
    const on = applyFormat("a\nb\nc", 0, 5, "bullets");
    expect(on.value).toBe("- a\n- b\n- c");
    const off = applyFormat(on.value, 0, on.value.length, "bullets");
    expect(off.value).toBe("a\nb\nc");
  });

  it("only bullets the lines the selection touches", () => {
    const r = applyFormat("a\nb\nc", 2, 3, "bullets");
    expect(r.value).toBe("a\n- b\nc");
  });
});
