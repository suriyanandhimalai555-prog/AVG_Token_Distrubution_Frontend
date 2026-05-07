interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  className?: string;
}

export default function StatCard({ label, value, sub, accent, className = "" }: StatCardProps) {
  return (
    <div className={`border border-border bg-surface p-4 ${className}`}>
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-mono">{label}</p>
      <p className={`text-3xl font-mono font-bold mt-1 ${accent ? "text-accent" : "text-text-primary"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-text-muted mt-1 font-mono">{sub}</p>}
    </div>
  );
}
