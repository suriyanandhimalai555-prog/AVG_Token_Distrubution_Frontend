import { useQuery } from "@tanstack/react-query";
import { statusApi } from "@/lib/api";
import { store } from "@/lib/store";
import { fmtBnb, fmt } from "@/lib/utils";

export default function TopBar() {
  const sessionId = store.getSessionId();

  const { data } = useQuery({
    queryKey: ["status", sessionId],
    queryFn: () => statusApi.get(sessionId).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: 10_000,
  });

  if (!sessionId || !data) return null;

  return (
    <div className="fixed top-0 left-14 right-0 h-10 z-40 bg-surface border-b border-border flex items-center px-6 gap-8">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">SESSION</span>
        <span className="text-[11px] font-mono text-text-primary">{sessionId.slice(-12)}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">STATUS</span>
        <span
          className={`text-[11px] font-mono uppercase ${
            data.status === "done"
              ? "text-success"
              : data.status === "distributing" || data.status === "generating"
              ? "text-warning"
              : data.status === "error"
              ? "text-danger"
              : "text-text-muted"
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">SENT</span>
        <span className="text-[11px] font-mono text-text-primary">
          {fmt(data.sentCount)} / {fmt(data.totalWallets)}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">BNB SPENT</span>
        <span className="text-[11px] font-mono text-accent">{fmtBnb(data.bnbSpent)}</span>
      </div>
    </div>
  );
}
