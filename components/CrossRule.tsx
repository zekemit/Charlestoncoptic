/** Gilt rule with a small Greek cross at its centre. Marks the break between major ideas. */
export function CrossRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-gilt ${className}`} role="presentation" aria-hidden="true">
      <span className="h-px flex-1 bg-current" />
      <svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor">
        <path d="M9 0h4v9h9v4h-9v9H9v-9H0V9h9z" />
        <rect x="0" y="0" width="4" height="4" opacity=".55" />
        <rect x="18" y="0" width="4" height="4" opacity=".55" />
        <rect x="0" y="18" width="4" height="4" opacity=".55" />
        <rect x="18" y="18" width="4" height="4" opacity=".55" />
      </svg>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}
