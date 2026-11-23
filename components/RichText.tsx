import { Fragment } from "react";
import { type Inline, parseBlocks } from "@/lib/rich-text";

function renderInline(nodes: Inline[], keyPrefix = ""): React.ReactNode {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}${i}`;
    switch (n.t) {
      case "text":
        return <Fragment key={key}>{n.v}</Fragment>;
      case "b":
        return <strong key={key}>{renderInline(n.c, `${key}.`)}</strong>;
      case "i":
        return <em key={key}>{renderInline(n.c, `${key}.`)}</em>;
      case "a": {
        const external = /^(https?:|mailto:|tel:)/i.test(n.href);
        return (
          <a
            key={key}
            href={n.href}
            className="link"
            {...(external && /^https?:/i.test(n.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {renderInline(n.c, `${key}.`)}
          </a>
        );
      }
    }
  });
}

/** Renders the popup's safe mini-markup as React elements (no raw HTML). */
export function RichText({ source, className = "" }: { source: string; className?: string }) {
  const blocks = parseBlocks(source);
  if (blocks.length === 0) return null;
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((b, i) =>
        b.t === "p" ? (
          <p key={i}>
            {b.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 ? <br /> : null}
                {renderInline(line, `${i}.${li}.`)}
              </Fragment>
            ))}
          </p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-6 marker:text-gilt">
            {b.items.map((it, ii) => (
              <li key={ii}>{renderInline(it, `${i}.${ii}.`)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
