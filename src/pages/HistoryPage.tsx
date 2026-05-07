import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { sessionsApi, type SessionAudit } from "@/lib/api";
import { store } from "@/lib/store";
import { fmt, fmtBnb, fmtTime } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";

export default function HistoryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const activeSessionId = store.getSessionId();

  const { data, isLoading } = useQuery({
    queryKey: ["sessions-history"],
    queryFn: () => sessionsApi.list().then((r) => r.data),
    refetchInterval: 10_000,
  });

  const sessions = data?.sessions ?? [];

  const { data: historyData } = useQuery({
    queryKey: ["sessions-audit-history"],
    queryFn: () => sessionsApi.history(200).then((r) => r.data),
    refetchInterval: 15_000,
  });
  const audits = historyData?.audits ?? [];

  async function deleteSession(sessionId: string) {
    const confirmed = await new Promise<boolean>((resolve) => {
      const id = toast.custom((t) => (
        <div className="border border-danger bg-surface p-3 w-[360px]">
          <p className="text-[11px] font-mono uppercase tracking-widest text-danger">Delete Session?</p>
          <p className="mt-2 text-[12px] font-mono text-text-muted">
            This will remove session, wallets, and batch records permanently.
          </p>
          <p className="mt-1 text-[11px] font-mono text-text-primary">ID: {sessionId.slice(-16)}</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="px-3 py-1 border border-border text-text-muted hover:text-text-primary text-[11px] font-mono uppercase"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 border border-danger text-danger hover:bg-danger hover:text-white text-[11px] font-mono uppercase"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ), { duration: Infinity });
      void id;
    });
    if (!confirmed) return;
    try {
      await sessionsApi.delete(sessionId);
      if (activeSessionId === sessionId) {
        store.clearSessionId();
      }
      toast.success("Session deleted");
      await qc.invalidateQueries({ queryKey: ["sessions-history"] });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Failed to delete session";
      toast.error(message);
    }
  }

  function openSession(sessionId: string, target: "results" | "distribute" | "plan") {
    store.setSessionId(sessionId);
    navigate(`/dashboard/${target}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-mono font-bold text-text-primary uppercase tracking-wide">Session History</h1>
        <p className="mt-1 text-sm text-text-muted font-mono">
          Open any previous session and continue from where it stopped.
        </p>
      </div>

      <div className="border border-border bg-surface">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            ALL SESSIONS — {fmt(sessions.length)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {["SESSION ID", "CREATED", "NETWORK", "WALLETS", "SENT", "FAILED", "BNB", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-text-muted">Loading sessions...</td>
                </tr>
              )}
              {!isLoading && sessions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-text-muted">No session history found.</td>
                </tr>
              )}
              {sessions.map((s, i) => {
                const isActive = activeSessionId === s._id;
                return (
                  <tr key={s._id} className={`border-b border-border/30 hover:bg-panel/30 ${i % 2 === 0 ? "" : "bg-surface/50"}`}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary">{s._id.slice(-16)}</span>
                        {isActive && (
                          <span className="text-[10px] border border-accent text-accent px-1.5 py-0.5">ACTIVE</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-text-muted">{fmtTime(s.createdAt)}</td>
                    <td className="py-2 px-3 text-text-muted">{s.network}</td>
                    <td className="py-2 px-3 text-text-primary">{fmt(s.totalWallets)}</td>
                    <td className="py-2 px-3 text-success">{fmt(s.sentCount)}</td>
                    <td className="py-2 px-3 text-danger">{fmt(s.failedCount)}</td>
                    <td className="py-2 px-3 text-accent">{fmtBnb(s.bnbSpent)}</td>
                    <td className="py-2 px-3"><StatusBadge status={s.status} /></td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openSession(s._id, "results")}
                          className="px-2 py-1 border border-border text-text-muted hover:border-accent hover:text-accent"
                        >
                          RESULTS
                        </button>
                        <button
                          onClick={() => openSession(s._id, "distribute")}
                          className="px-2 py-1 border border-border text-text-muted hover:border-accent hover:text-accent"
                        >
                          DISTRIBUTE
                        </button>
                        <button
                          onClick={() => deleteSession(s._id)}
                          className="px-2 py-1 border border-danger text-danger hover:bg-danger hover:text-white"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-border bg-surface mt-6">
        <div className="px-4 py-2 border-b border-border">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            SESSION TIMELINE — backend audit log
          </p>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {audits.length === 0 ? (
            <p className="py-6 px-4 text-text-muted font-mono text-xs">No audit history yet.</p>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {["TIME", "SESSION ID", "ACTION", "MESSAGE"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audits.map((a: SessionAudit, i) => (
                  <tr key={a._id} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-surface/50"}`}>
                    <td className="py-2 px-3 text-text-muted">{fmtTime(a.createdAt)}</td>
                    <td className="py-2 px-3 text-text-primary">{a.sessionId.slice(-16)}</td>
                    <td className="py-2 px-3 text-accent">{a.action}</td>
                    <td className="py-2 px-3 text-text-muted">{a.message ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
