import { CrossRule } from "@/components/CrossRule";

export function PageHeader({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gilt/50 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-12 sm:px-8 md:pt-16">
        <h1>{title}</h1>
        {lede ? <p className="mt-4 max-w-2xl text-xl text-ink-soft">{lede}</p> : null}
        {children}
        <CrossRule className="mt-8 max-w-sm" />
      </div>
    </div>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 md:py-16 ${className}`}>{children}</div>;
}
