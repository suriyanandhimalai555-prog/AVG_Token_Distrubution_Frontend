import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { estimateApi, prepareApi, sessionsApi, statusApi } from "@/lib/api";
import { api } from "@/lib/api";
import { store } from "@/lib/store";
import { fmt, pct } from "@/lib/utils";
import { countBatchesForWalletCount, DEFAULT_MULTI_BATCH_SIZE } from "@/lib/distributionBatching";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import AddressCell from "@/components/ui/AddressCell";
import StatusBadge from "@/components/ui/StatusBadge";

const BUCKETS = [
  [1, 14], [15, 28], [29, 42], [43, 56],
  [57, 70], [71, 84], [85, 100],
];

interface WalletEntry {
  index: number;
  address: string;
  amount: number;
  amountWei: string;
  sent: boolean;
  failed?: boolean;
  failureReason?: string;
}

export default function PlanPage() {
  const navigate = useNavigate();
  const sessionId = store.getSessionId();
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const privateKey = store.getPrivateKey();
  const PAGE_SIZE = 20;

  const { data: status } = useQuery({
    queryKey: ["status", sessionId],
    queryFn: () => statusApi.get(sessionId).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  const { data: walletsData, refetch } = useQuery({
    queryKey: ["wallets-plan", sessionId, page],
    queryFn: () =>
      api.get<{ wallets: WalletEntry[]; total: number }>(
        `/api/batches/wallets?sessionId=${sessionId}&skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`
      ).then((r) => r.data),
    enabled: !!sessionId,
  });
  const wallets = walletsData?.wallets ?? [];
  const total = walletsData?.total ?? 0;
  const { data: walletSummary } = useQuery({
    queryKey: ["wallets-summary", sessionId],
    queryFn: () =>
      api.get<{ totalWallets: number; totalTokens: number }>(
        `/api/batches/wallets/summary?sessionId=${sessionId}`
      ).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.get(sessionId).then((r) => r.data),
    enabled: !!sessionId,
  });

  const {
    data: preflight,
    isFetching: preflightLoading,
    error: preflightError,
    refetch: refetchPreflight,
  } = useQuery({
    queryKey: ["preflight", sessionId, status?.totalWallets],
    queryFn: () =>
      estimateApi
        .preflight(sessionId, privateKey, sessionData?.session?.network)
        .then((r) => r.data),
    enabled: !!sessionId && !!privateKey && !!sessionData?.session?.tokenAddress && wallets.length > 0,
    refetchInterval: 15000,
  });
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const isPreparing = status?.status === "preparing";

  // Build histogram from wallets
  const histData = BUCKETS.map(([lo, hi]) => ({
    range: `${lo}-${hi}`,
    count: wallets.filter((w) => w.amount >= lo && w.amount <= hi).length,
  }));

  // Stats
  const totalTokens = walletSummary?.totalTokens ?? 0;
  const minPossible = (status?.totalWallets ?? 0) * 1;
  const maxPossible = (status?.totalWallets ?? 0) * 100;
  const batchCount = countBatchesForWalletCount(
    status?.totalWallets ?? 0,
    preflight?.batchSize ?? DEFAULT_MULTI_BATCH_SIZE
  );
  /** Preflight is informational only — user may start distribution regardless of estimates. */
  const canNavigateToDistribute = wallets.length > 0 && !!privateKey;

  async function handlePrepare() {
    setLoading(true);
    try {
      await prepareApi.start(sessionId);
      toast.success("Preparation started");
      setTimeout(() => refetch(), 3000);
    } catch {
      toast.error("Failed to start preparation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/dashboard/generate")}
            className="mb-3 px-3 py-1.5 border border-border text-text-muted font-mono text-[10px] uppercase tracking-widest hover:border-accent hover:text-accent inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={11} /> Back to Generate
          </button>
          <h1 className="text-xl font-mono font-bold text-text-primary uppercase tracking-wide">Distribution Plan</h1>
          <p className="mt-1 text-sm text-text-muted font-mono">Review before executing.</p>
        </div>
        <StatusBadge status={status?.status ?? "idle"} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard label="Total Wallets" value={fmt(status?.totalWallets ?? 0)} sub="recipients" />
        <StatCard label="Min Possible" value={fmt(minPossible)} sub="tokens" />
        <StatCard label="Max Possible" value={fmt(maxPossible)} sub="tokens" />
        <StatCard
          label="Est. on-chain txs"
          value={fmt(batchCount)}
          sub={`${preflight?.batchSize ?? DEFAULT_MULTI_BATCH_SIZE} wallets per batch`}
          accent
        />
      </div>

      {/* Chart + controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 border border-border bg-surface p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-4">
            TOKEN DISTRIBUTION HISTOGRAM
          </p>
          {wallets.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={histData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#6b6b6b" }}
                  axisLine={{ stroke: "#1f1f23" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#6b6b6b" }}
                  axisLine={{ stroke: "#1f1f23" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: "#111113", border: "1px solid #1f1f23", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  labelStyle={{ color: "#6b6b6b" }}
                  itemStyle={{ color: "#00d4aa" }}
                  cursor={{ fill: "#1f1f23" }}
                />
                <Bar dataKey="count" fill="#00d4aa" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-text-muted font-mono text-sm">
              No plan data yet — prepare first.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePrepare}
            disabled={loading || isPreparing}
            className="w-full py-3 border border-accent text-accent font-mono text-xs uppercase tracking-widest hover:bg-accent hover:text-black transition-colors disabled:opacity-40"
          >
            {isPreparing ? "PREPARING..." : loading ? "STARTING..." : "PREPARE PLAN"}
          </button>
          {wallets.length > 0 && !isPreparing && (
            <button
              onClick={() => {
                if (!privateKey) {
                  toast.error("Private key not found. Go back to Setup and initialize again.");
                  return;
                }
                navigate("/dashboard/distribute");
              }}
              className="w-full py-3 border border-success text-success font-mono text-xs uppercase tracking-widest hover:bg-success hover:text-black transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!canNavigateToDistribute}
            >
              START DISTRIBUTION <ArrowRight size={12} />
            </button>
          )}
          <div className="border border-border bg-surface p-3 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-text-muted">LOADED WALLETS</span>
              <span className="text-text-primary">{fmt(total)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-text-muted">TOTAL TOKENS (FULL PLAN)</span>
              <span className="text-accent">{fmt(totalTokens)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-text-muted">MULTI-TX CHUNK SIZE</span>
              <span className="text-text-primary">
                {preflight?.batchSize ?? DEFAULT_MULTI_BATCH_SIZE} wallets per tx (batching mode)
              </span>
            </div>
          </div>

          <div className="border border-border bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-muted">PREFLIGHT GAS / BNB CHECK</span>
              <button
                onClick={() => refetchPreflight()}
                className="text-accent hover:underline disabled:opacity-40"
                disabled={preflightLoading || !privateKey}
              >
                {preflightLoading ? "CHECKING..." : "REFRESH"}
              </button>
            </div>
            {!privateKey && (
              <p className="text-warning text-[10px] font-mono">
                Private key missing in memory. Go Setup and initialize session again.
              </p>
            )}
            {preflightError && (
              <p className="text-warning text-[10px] font-mono">
                Could not run preflight check. Verify token address/private key and RPC.
              </p>
            )}
            {preflight && (
              <>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-text-muted">{preflight.nativeSymbol} BALANCE</span>
                  <span className="text-text-primary">{Number(preflight.bnb.balance).toFixed(6)} {preflight.nativeSymbol}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-text-muted">EST. {preflight.nativeSymbol} COST (LIKELY)</span>
                  <span className="text-accent">{Number(preflight.gas.estimatedBnbLikely).toFixed(6)} {preflight.nativeSymbol}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-text-muted">EST. {preflight.nativeSymbol} COST (MAX)</span>
                  <span className="text-text-primary">{Number(preflight.gas.estimatedBnbMax).toFixed(6)} {preflight.nativeSymbol}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-text-muted">TOKEN BALANCE</span>
                  <span className="text-text-primary">
                    {Number(preflight.token.balance).toLocaleString()} {preflight.token.symbol}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-text-muted">TOKEN NEEDED (MAX)</span>
                  <span className="text-accent">
                    {preflight.token.requiredMax.toLocaleString()} {preflight.token.symbol}
                  </span>
                </div>
                <div className="pt-1 space-y-2">
                  <p className="text-text-muted text-[10px] font-mono leading-relaxed">
                    Figures above are estimates only; actual gas, fees, and token amounts may vary with network conditions.
                  </p>
                  {preflight.token.enoughForMax && preflight.bnb.enoughLikely ? (
                    <p className="text-success text-[10px] font-mono">
                      Ready: balance looks sufficient versus these estimates.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(preflight.tokenSourceNetwork ?? "selected") !== "selected" && (
                        <p className="text-warning text-[10px] font-mono">
                          ℹ Token data is coming from mainnet fallback for preview.
                        </p>
                      )}
                      <p className="text-warning text-[10px] font-mono">
                        ⚠ Low balance risk versus estimates — you can still start; ensure enough {preflight.nativeSymbol} and{" "}
                        {preflight.token.symbol} on chain for real execution.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!privateKey) {
                            toast.error("Private key not found. Go back to Setup and initialize again.");
                            return;
                          }
                          navigate("/dashboard/distribute");
                        }}
                        disabled={!privateKey}
                        className="w-full py-2 border border-success text-success font-mono text-[10px] uppercase tracking-widest hover:bg-success hover:text-black transition-colors disabled:opacity-40"
                      >
                        Start distribution
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Wallet table */}
      <div className="border border-border bg-surface">
        <div className="px-4 py-2 border-b border-border">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            WALLET PLAN — {fmt(total)} total
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {["#", "ADDRESS", "AMOUNT", "AMOUNT WEI", "STATUS", "REASON"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-text-muted font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wallets.map((w, i) => (
                (() => {
                  const isLegacyPending = !w.sent && w.failureReason === "Not sent yet";
                  const resolvedFailed = Boolean(w.failed && !isLegacyPending);
                  const resolvedReason = w.sent ? "—" : (isLegacyPending ? "Not sent" : (w.failureReason || "Not sent"));
                  return (
                <tr key={w.index} className={`border-b border-border/30 hover:bg-panel/30 ${i % 2 === 0 ? "" : "bg-surface/50"}`}>
                  <td className="py-1.5 px-3 text-text-muted">{w.index}</td>
                  <td className="py-1.5 px-3"><AddressCell address={w.address} /></td>
                  <td className="py-1.5 px-3 text-accent">{w.amount > 0 ? fmt(w.amount) : <span className="text-text-muted">—</span>}</td>
                  <td className="py-1.5 px-3 text-text-muted truncate max-w-[140px]">{w.amountWei !== "0" ? w.amountWei.slice(0, 16) + "..." : "—"}</td>
                  <td className="py-1.5 px-3">
                    <StatusBadge status={w.sent ? "confirmed" : (resolvedFailed ? "failed" : "pending")} />
                  </td>
                  <td className="py-1.5 px-3 text-text-muted">{resolvedReason}</td>
                </tr>
                  );
                })()
              ))}
              {wallets.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-text-muted">No wallets loaded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-[10px] font-mono text-text-muted">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-border text-[10px] font-mono text-text-muted hover:border-accent hover:text-accent disabled:opacity-30">PREV</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-border text-[10px] font-mono text-text-muted hover:border-accent hover:text-accent disabled:opacity-30">NEXT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
