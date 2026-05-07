import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Play, Square, AlertTriangle, ArrowLeft } from "lucide-react";
import { distributeApi, estimateApi, sessionsApi, statusApi } from "@/lib/api";
import { store } from "@/lib/store";
import { fmt, fmtBnb, fmtDuration, pct } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import LiveLog, { LogLine } from "@/components/ui/LiveLog";
import BatchTable from "@/components/ui/BatchTable";

export default function DistributePage() {
  const navigate = useNavigate();
  const sessionId = store.getSessionId();
  const qc = useQueryClient();
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingStop, setLoadingStop] = useState(false);

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["status", sessionId],
    queryFn: () => statusApi.get(sessionId).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: (data) =>
      data?.state?.data?.status === "distributing" ? 3000 : 8000,
  });

  const isDistributing = status?.status === "distributing" || status?.isRunning;
  const isDone = status?.status === "done";
  useEffect(() => {
    if (!isDone) return;
    // Distribution finished — clear sensitive/runtime setup values
    store.clearPrivateKey();
    sessionStorage.removeItem("setupDraft");
  }, [isDone]);

  async function startDistribute() {
    const pk = store.getPrivateKey();
    if (!pk) {
      toast.error("Private key not found — go back to Setup");
      return;
    }
    setLoadingStart(true);
    try {
      const sessionRes = await sessionsApi.get(sessionId);
      const session = sessionRes.data.session;
      const pre = await estimateApi.preflight(sessionId, pk, session.network);
      if ((pre.data.tokenSourceNetwork ?? "selected") !== "selected") {
        toast("Note: token preview uses mainnet fallback data.", { icon: "ℹ️" });
      }
      await distributeApi.start(sessionId, pk);
      toast.success("Distribution started");
      setTimeout(() => refetchStatus(), 1500);
    } catch (err: unknown) {
      toast.error("Failed to start distribution");
    } finally {
      setLoadingStart(false);
    }
  }

  async function stopDistribute() {
    setLoadingStop(true);
    try {
      await distributeApi.stop(sessionId);
      toast("Distribution stopped", { icon: "⛔" });
      refetchStatus();
    } catch {
      toast.error("Failed to stop");
    } finally {
      setLoadingStop(false);
    }
  }

  const onBatch = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["status", sessionId] });
    qc.invalidateQueries({ queryKey: ["batches", sessionId] });
  }, [qc, sessionId]);

  const progress = pct(status?.sentCount ?? 0, status?.totalWallets ?? 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/dashboard/plan")}
            className="mb-3 px-3 py-1.5 border border-border text-text-muted font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={11} /> Back to Plan
          </button>
          <h1 className="text-xl font-mono font-bold text-text-primary uppercase tracking-wide">Distribution Engine</h1>
          <p className="mt-1 text-sm text-text-muted font-mono">Session: <span className="text-accent">{sessionId.slice(-16)}</span></p>
        </div>
        <StatusBadge status={status?.status ?? "idle"} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left column — 40% */}
        <div className="col-span-2 space-y-4">
          {/* Progress */}
          <div className="border border-border bg-surface p-5">
            <div className="text-4xl font-mono font-bold text-text-primary tabular-nums">
              {fmt(status?.sentCount ?? 0)}
              <span className="text-text-muted text-2xl"> / {fmt(status?.totalWallets ?? 0)}</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mt-1">WALLETS SENT</p>
            <div className="mt-4">
              <ProgressBar value={progress} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-mono text-text-muted">{progress}% complete</span>
                <span className="text-[10px] font-mono text-text-muted">
                  {fmt(status?.failedCount ?? 0)} failed
                </span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">CONFIRMED</p>
              <p className="text-xl font-mono font-bold text-success mt-1">{fmt(status?.confirmedBatches ?? 0)}</p>
              <p className="text-[10px] font-mono text-text-muted">batches</p>
            </div>
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">FAILED</p>
              <p className="text-xl font-mono font-bold text-danger mt-1">{fmt(status?.failedBatches ?? 0)}</p>
              <p className="text-[10px] font-mono text-text-muted">batches</p>
            </div>
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">BNB SPENT</p>
              <p className="text-lg font-mono font-bold text-accent mt-1">{fmtBnb(status?.bnbSpent)}</p>
            </div>
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">ELAPSED</p>
              <p className="text-lg font-mono font-bold text-text-primary mt-1">
                {fmtDuration(status?.startedAt, isDone ? status?.completedAt : undefined)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            {!isDistributing && !isDone && (
              <button
                onClick={startDistribute}
                disabled={loadingStart}
                className="w-full py-3 border border-accent text-accent font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Play size={12} />
                {loadingStart ? "STARTING..." : "START DISTRIBUTION"}
              </button>
            )}
            {isDone && (
              <div className="border border-success p-3 text-center">
                <p className="text-success font-mono text-sm uppercase">Distribution Complete</p>
              </div>
            )}
            {isDistributing && (
              <button
                onClick={stopDistribute}
                disabled={loadingStop}
                className="w-full py-3 border border-danger text-danger font-mono text-xs uppercase tracking-widest hover:bg-danger hover:text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Square size={12} />
                {loadingStop ? "CANCELLING..." : "CANCEL REMAINING BATCHES"}
              </button>
            )}
            {!isDistributing && status?.status === "stopped" && (
              <div className="border border-warning p-3 text-center">
                <p className="text-warning font-mono text-xs uppercase">
                  Distribution stopped. Partial results saved.
                </p>
              </div>
            )}
          </div>

          {/* RPC health */}
          <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">RPC PROVIDERS</p>
            {[
              { name: "Alchemy (Primary)", active: isDistributing },
              { name: "Binance Fallback 1", active: false },
              { name: "Binance Fallback 2", active: false },
            ].map((rpc) => (
              <div key={rpc.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${rpc.active ? "bg-success animate-pulse" : "bg-text-muted"}`} />
                  <span className="text-[11px] font-mono text-text-muted">{rpc.name}</span>
                </div>
                <span className={`text-[10px] font-mono ${rpc.active ? "text-success" : "text-text-muted"}`}>
                  {rpc.active ? "ACTIVE" : "STANDBY"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — 60% */}
        <div className="col-span-3 space-y-4">
          {/* Live log */}
          <LiveLog sessionId={sessionId} onBatch={onBatch} />

          {/* Batch table */}
          <div className="border border-border bg-surface">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">BATCH LOG</p>
            </div>
            <BatchTable sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  );
}
