import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Eye, EyeOff, Download, ArrowRight, ArrowLeft } from "lucide-react";
import { generateApi, statusApi } from "@/lib/api";
import { store } from "@/lib/store";
import { fmt, fmtDuration, pct } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import StatusBadge from "@/components/ui/StatusBadge";
import AddressCell from "@/components/ui/AddressCell";
import { api } from "@/lib/api";

interface WalletPreview {
  index: number;
  address: string;
  derivationPath: string;
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const sessionId = store.getSessionId();
  const [loading, setLoading] = useState(false);
  const [mnemonicVisible, setMnemonicVisible] = useState(false);

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["status", sessionId],
    queryFn: () => statusApi.get(sessionId).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: (data) =>
      data?.state?.data?.status === "generating" ? 1500 : 5000,
  });

  const { data: walletsData } = useQuery({
    queryKey: ["wallets-preview", sessionId],
    queryFn: () =>
      api.get<{ wallets: WalletPreview[]; total: number }>(
        `/api/batches/wallets?sessionId=${sessionId}&limit=20`
      ).then((r) => r.data),
    enabled: !!sessionId && status?.status !== "generating",
    refetchInterval: 10_000,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.get<{ session: { masterMnemonic?: string } }>(`/api/sessions/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId,
  });

  async function startGenerate() {
    const pk = store.getPrivateKey();
    if (!pk) {
      toast.error("Private key not found — please restart from Setup");
      return;
    }
    setLoading(true);
    try {
      await generateApi.start(sessionId, pk);
      toast.success("Wallet generation started");
      refetchStatus();
    } catch {
      toast.error("Failed to start generation");
    } finally {
      setLoading(false);
    }
  }

  const isGenerating = status?.status === "generating";
  const isDone = (walletsData?.total ?? 0) > 0 && status?.status !== "generating";
  const progress = pct(status?.sentCount ?? 0, status?.totalWallets ?? 1);
  const mnemonic = sessionData?.session?.masterMnemonic;
  const words = mnemonic?.split(" ") ?? [];

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-text-muted font-mono">No active session.</p>
          <button onClick={() => navigate("/dashboard/setup")} className="mt-4 px-4 py-2 border border-accent text-accent font-mono text-xs hover:bg-accent hover:text-black transition-colors">
            GO TO SETUP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard/setup")}
          className="mb-3 px-3 py-1.5 border border-border text-text-muted font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={11} /> Back to Setup
        </button>
        <h1 className="text-xl font-mono font-bold text-text-primary uppercase tracking-wide">Wallet Generation</h1>
        <p className="mt-1 text-sm text-text-muted font-mono">Session: <span className="text-accent">{sessionId.slice(-16)}</span></p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left panel — 60% */}
        <div className="col-span-3 space-y-4">
          {/* Counter */}
          <div className="border border-border bg-surface p-6">
            <div className="text-5xl font-mono font-bold text-text-primary tabular-nums">
              {fmt(status?.sentCount ?? 0).padStart(5, "0")}
              <span className="text-text-muted"> / {fmt(status?.totalWallets ?? 0)}</span>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-text-muted mt-2">WALLETS GENERATED</p>
            <div className="mt-4">
              <ProgressBar value={progress} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">STATUS</p>
              <div className="mt-2">
                <StatusBadge status={status?.status ?? "idle"} />
              </div>
            </div>
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">ELAPSED</p>
              <p className="mt-2 text-sm font-mono text-text-primary">
                {fmtDuration(status?.startedAt, isGenerating ? undefined : status?.completedAt)}
              </p>
            </div>
            <div className="border border-border bg-surface p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">PROGRESS</p>
              <p className="mt-2 text-sm font-mono text-accent">{progress}%</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={startGenerate}
              disabled={loading || isGenerating}
              className="flex-1 py-2.5 border border-accent text-accent font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? "GENERATING..." : loading ? "STARTING..." : "GENERATE WALLETS"}
            </button>
            {isDone && (
              <a
                href={`/api/export?sessionId=${sessionId}&file=wallets`}
                download
                className="px-4 py-2.5 border border-border text-text-muted font-mono text-xs uppercase tracking-widest hover:border-accent hover:text-accent transition-colors flex items-center gap-2"
              >
                <Download size={12} />
                CSV
              </a>
            )}
          </div>

          {isDone && (
            <button
              onClick={() => navigate("/dashboard/plan")}
              className="w-full py-2.5 border border-success text-success font-mono text-xs uppercase tracking-widest hover:bg-success hover:text-black transition-colors flex items-center justify-center gap-2"
            >
              PROCEED TO PLAN <ArrowRight size={12} />
            </button>
          )}

          {/* Mnemonic */}
          {mnemonic && (
            <div className="border border-warning bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-warning">MASTER MNEMONIC — SAVE THIS</p>
                <button
                  onClick={() => setMnemonicVisible((v) => !v)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  {mnemonicVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className={`grid grid-cols-4 gap-1.5 ${!mnemonicVisible ? "blur-sm select-none" : ""}`}>
                {words.map((word, i) => (
                  <div key={i} className="flex items-center gap-1 border border-border px-2 py-1 bg-terminal">
                    <span className="text-[9px] font-mono text-text-muted w-4">{i + 1}.</span>
                    <span className="text-xs font-mono text-text-primary">{word}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-mono text-warning">
                ⚠ This phrase controls all generated wallets. It cannot be recovered.
              </p>
            </div>
          )}
        </div>

        {/* Right panel — wallet preview */}
        <div className="col-span-2 border border-border bg-surface">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
              LIVE PREVIEW — {fmt(walletsData?.total ?? 0)} wallets
            </p>
          </div>
          <div className="overflow-y-auto" style={{ height: "480px" }}>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 text-[10px] text-text-muted font-normal">#</th>
                  <th className="text-left py-2 px-3 text-[10px] text-text-muted font-normal">ADDRESS</th>
                </tr>
              </thead>
              <tbody>
                {(walletsData?.wallets ?? []).map((w, i) => (
                  <tr key={w.index} className={`border-b border-border/30 ${i % 2 === 0 ? "" : "bg-panel/30"}`}>
                    <td className="py-1.5 px-3 text-text-muted">{w.index}</td>
                    <td className="py-1.5 px-3">
                      <AddressCell address={w.address} />
                    </td>
                  </tr>
                ))}
                {(walletsData?.wallets ?? []).length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-text-muted">
                      {isGenerating ? "Generating..." : "No wallets yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
