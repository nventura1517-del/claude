export function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-semibold text-ink">{clamped}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
