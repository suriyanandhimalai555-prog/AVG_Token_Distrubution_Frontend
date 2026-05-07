import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Eye, EyeOff, CheckCircle, AlertCircle,
  RefreshCw, Loader2, Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { configApi, deployApi, sessionsApi, walletApi } from "@/lib/api";
import { store } from "@/lib/store";
import { isValidPrivateKey } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type Network = "bscMainnet" | "bscTestnet";

const NETWORKS: { value: Network; label: string; chainId: string; color: string }[] = [
  { value: "bscMainnet", label: "BNB Mainnet",  chainId: "56",   color: "text-warning" },
  { value: "bscTestnet", label: "BNB Testnet",  chainId: "97",   color: "text-accent"  },
];
const SETUP_DRAFT_KEY = "setupDraft";

function isValidAddress(v: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(v.trim());
}

function maskPrivateKey(v: string): string {
  const raw = v.startsWith("0x") ? v : `0x${v}`;
  if (raw.length <= 14) return "********";
  return `${raw.slice(0, 8)}...${raw.slice(-4)}`;
}

function shortAddress(v: string): string {
  const t = v.trim();
  if (t.length < 12) return t;
  return `${t.slice(0, 8)}...${t.slice(-6)}`;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  const ok = value && value.trim().length > 0;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/50 last:border-0 gap-4">
      <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted flex-shrink-0 w-40">
        {label}
      </span>
      <span className={`text-[12px] font-mono truncate max-w-sm text-right ${ok ? "text-text-primary" : "text-danger"}`}>
        {ok ? value : "NOT SET"}
      </span>
    </div>
  );
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [privateKey, setPrivateKey]         = useState("");
  const [showKey, setShowKey]               = useState(false);
  const [tokenAddress, setTokenAddress]     = useState("");
  const [totalWallets, setTotalWallets]     = useState(100);
  const [totalWalletsInput, setTotalWalletsInput] = useState("100");

  // ── MultiSender deploy state ─────────────────────────────────────────────
  const [selectedNetwork, setSelectedNetwork] = useState<Network>("bscMainnet");
  const [deploying, setDeploying]             = useState(false);
  const [deployedAddress, setDeployedAddress] = useState("");   // set after deploy
  const [deployNetwork, setDeployNetwork]     = useState("");   // network label after deploy
  const [showManualInput, setShowManualInput] = useState(false); // toggle for manual override
  const [manualAddress, setManualAddress]     = useState("");

  // ── Validation errors ───────────────────────────────────────────────────
  const [pkError, setPkError]   = useState("");
  const [taError, setTaError]   = useState("");
  const [msError, setMsError]   = useState("");  // manual address error
  const [loading, setLoading]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── The effective multisender address used when creating session ─────────
  const multisenderAddress = showManualInput ? manualAddress : deployedAddress;
  const hasActivePlan = subscription?.status === "ACTIVE";
  const canUseSetup = hasActivePlan || user?.role === "ADMIN";
  const selectedNetworkLabel = NETWORKS.find((n) => n.value === selectedNetwork)?.label ?? "Unknown";

  // ── Load RPC config + pre-deployed address from backend ─────────────────
  const { data: config, isLoading: configLoading, error: configError, refetch: refetchConfig } = useQuery({
    queryKey: ["config"],
    queryFn: () => configApi.get().then((r) => r.data),
    retry: 1,
  });
  const selectedPrimaryRpc = selectedNetwork === "bscTestnet" ? (config?.testnetRpcUrl ?? "") : (config?.rpcUrl ?? "");

  // Auto-fill deployed address from output/deployments.json
  useEffect(() => {
    if (config?.multisenderAddress && !deployedAddress) {
      setDeployedAddress(config.multisenderAddress);
      setDeployNetwork(config.deploymentInfo?.network ?? "");
    }
  }, [config]);

  // Restore draft on first load
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SETUP_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        privateKey?: string;
        tokenAddress?: string;
        totalWallets?: number;
        selectedNetwork?: Network;
        deployedAddress?: string;
        deployNetwork?: string;
        showManualInput?: boolean;
        manualAddress?: string;
      };
      if (draft.privateKey) setPrivateKey(draft.privateKey);
      if (draft.tokenAddress) setTokenAddress(draft.tokenAddress);
      if (draft.totalWallets && Number.isFinite(draft.totalWallets)) setTotalWallets(draft.totalWallets);
      if (draft.selectedNetwork) setSelectedNetwork(draft.selectedNetwork);
      if (draft.deployedAddress) setDeployedAddress(draft.deployedAddress);
      if (draft.deployNetwork) setDeployNetwork(draft.deployNetwork);
      if (typeof draft.showManualInput === "boolean") setShowManualInput(draft.showManualInput);
      if (draft.manualAddress) setManualAddress(draft.manualAddress);
    } catch {
      // ignore corrupt draft
    }
  }, []);

  // Persist draft whenever key fields change
  useEffect(() => {
    const draft = {
      privateKey,
      tokenAddress,
      totalWallets,
      selectedNetwork,
      deployedAddress,
      deployNetwork,
      showManualInput,
      manualAddress,
    };
    sessionStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft));
  }, [
    privateKey,
    tokenAddress,
    totalWallets,
    selectedNetwork,
    deployedAddress,
    deployNetwork,
    showManualInput,
    manualAddress,
  ]);

  useEffect(() => {
    setTotalWalletsInput(String(totalWallets));
  }, [totalWallets]);

  const pkForPreview = privateKey.trim();
  const tokenForPreview = tokenAddress.trim();
  const canPreview = isValidPrivateKey(pkForPreview) && isValidAddress(tokenForPreview);

  const {
    data: walletPreview,
    isFetching: previewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ["wallet-preview", pkForPreview, tokenForPreview, selectedNetwork],
    queryFn: () =>
      walletApi
        .preview(
          pkForPreview.startsWith("0x") ? pkForPreview : `0x${pkForPreview}`,
          tokenForPreview,
          selectedNetwork
        )
        .then((r) => r.data),
    enabled: canPreview,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const requiredMin = totalWallets * 1;
  const requiredAvg = Math.round(totalWallets * 50.5);
  const requiredMax = totalWallets * 100;
  const tokenBalanceNum = Number(walletPreview?.token?.balance ?? "0");
  const hasEnoughForMax = tokenBalanceNum >= requiredMax;
  const tokenName = walletPreview?.token?.name?.trim() || "Unknown Token";

  function handleWalletsNumberChange(v: string): void {
    setTotalWalletsInput(v);
    const parsed = Number(v);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(100_000, Math.max(1, Math.floor(parsed)));
    setTotalWallets(clamped);
  }

  // ── Validation helpers ──────────────────────────────────────────────────
  function validatePrivateKey(v: string) {
    if (!v.trim())                    { setPkError("Private key is required"); return false; }
    if (!isValidPrivateKey(v.trim())) { setPkError("Invalid — must be 64 hex chars (with or without 0x)"); return false; }
    setPkError(""); return true;
  }
  function validateTokenAddress(v: string) {
    if (!v.trim())          { setTaError("Token address is required"); return false; }
    if (!isValidAddress(v)) { setTaError("Invalid address (0x + 40 hex chars)"); return false; }
    setTaError(""); return true;
  }
  function validateManualAddress(v: string) {
    if (!v.trim())          { setMsError("MultiSender address is required"); return false; }
    if (!isValidAddress(v)) { setMsError("Invalid address (0x + 40 hex chars)"); return false; }
    setMsError(""); return true;
  }

  // ── Deploy MultiSender ──────────────────────────────────────────────────
  async function handleDeploy() {
    if (!validatePrivateKey(privateKey)) {
      toast.error("Enter your Private Key first — it is needed to pay for deployment gas");
      return;
    }

    const pk = privateKey.trim();
    const netLabel = NETWORKS.find((n) => n.value === selectedNetwork)?.label ?? selectedNetwork;

    setDeploying(true);
    const toastId = toast.loading(`Deploying MultiSender to ${netLabel}... (may take 30–60s)`);

    try {
      const { data } = await deployApi.multisender(
        pk.startsWith("0x") ? pk : `0x${pk}`,
        selectedNetwork
      );
      setDeployedAddress(data.address);
      setDeployNetwork(netLabel);
      setShowManualInput(false); // switch back to deployed view
      toast.success(`Deployed! ${data.address.slice(0, 10)}...${data.address.slice(-6)}`, { id: toastId });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Deployment failed. Check that your wallet has enough BNB for gas.";
      toast.error(msg, { id: toastId, duration: 8000 });
    } finally {
      setDeploying(false);
    }
  }

  // ── Create session ───────────────────────────────────────────────────────
  function validateAllInputs(): boolean {
    const pkOk = validatePrivateKey(privateKey);
    const taOk = validateTokenAddress(tokenAddress);

    // Must have a multisender address — either deployed or manual
    let msOk = true;
    if (!multisenderAddress) {
      msOk = false;
      if (showManualInput) {
        validateManualAddress(manualAddress);
      } else {
        toast.error("Deploy the MultiSender contract first, or toggle 'Use existing address'");
      }
    } else if (showManualInput) {
      msOk = validateManualAddress(manualAddress);
    }

    return pkOk && taOk && msOk;
  }

  async function createSession() {
    setLoading(true);
    try {
      const existingSessionId = store.getSessionId();
      let sessionId = existingSessionId;
      if (existingSessionId) {
        try {
          await sessionsApi.patch(existingSessionId, {
            totalWallets,
            network: selectedNetwork,
            tokenAddress: tokenAddress.trim(),
            tokenName,
            multisenderAddress: multisenderAddress.trim(),
          });
          toast.success(`Session updated — ID: ${existingSessionId.slice(-8)}`);
        } catch {
          // If old session was deleted/not found, create fresh one.
          const { data } = await sessionsApi.create(
            totalWallets,
            selectedNetwork,
            tokenAddress.trim(),
            tokenName,
            multisenderAddress.trim()
          );
          sessionId = data.sessionId;
          toast.success(`Session created — ID: ${data.sessionId.slice(-8)}`);
        }
      } else {
        const { data } = await sessionsApi.create(
          totalWallets,
          selectedNetwork,
          tokenAddress.trim(),
          tokenName,
          multisenderAddress.trim()
        );
        sessionId = data.sessionId;
        toast.success(`Session created — ID: ${data.sessionId.slice(-8)}`);
      }
      if (!sessionId) throw new Error("Unable to resolve session id");
      store.setSessionId(sessionId);

      const pk = privateKey.trim();
      store.setPrivateKey(pk.startsWith("0x") ? pk : `0x${pk}`);
      navigate("/dashboard/generate");
    } catch {
      toast.error("Failed to create session");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAllInputs()) return;
    setShowConfirm(true);
  }

  const rpcOk = config?.rpcUrl;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-mono font-bold text-text-primary uppercase tracking-wide">
          Initialize Session
        </h1>
        <p className="mt-1 text-sm text-text-muted font-mono">
          Configure your distribution — deploy the MultiSender contract then start
        </p>
      </div>

      {/* RPC Status panel */}
      <div className="border border-border bg-surface mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted">
            RPC ENDPOINTS (backend .env)
          </span>
          <div className="flex items-center gap-3">
            {configLoading ? (
              <Loader2 size={12} className="text-text-muted animate-spin" />
            ) : rpcOk ? (
              <span className="flex items-center gap-1 text-[10px] font-mono text-success">
                <CheckCircle size={11} /> READY
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono text-warning">
                <AlertCircle size={11} /> CHECK .env
              </span>
            )}
            <button onClick={() => refetchConfig()} className="text-text-muted hover:text-accent transition-colors" title="Refresh">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
        {!configLoading && config && !configError && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between py-2.5 border-b border-border/50 gap-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted flex-shrink-0 w-40">
                Active Network
              </span>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value as Network)}
                className="bg-terminal border border-border font-mono text-[12px] text-text-primary px-2 py-1 outline-none focus:border-accent"
              >
                <option value="bscMainnet">BNB Mainnet</option>
                <option value="bscTestnet">BNB Testnet</option>
              </select>
            </div>
            <FieldRow label="Primary RPC"    value={selectedPrimaryRpc} />
            <FieldRow label="Testnet RPC"    value={config.testnetRpcUrl} />
            <FieldRow label="Fallback RPC 1" value={config.fallback1} />
            <FieldRow label="Fallback RPC 2" value={config.fallback2} />
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleStart} className="space-y-4">
        {!canUseSetup && (
          <div className="border border-[#f59e0b] bg-[#f59e0b14] p-4">
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#f59e0b]">Read-only mode</p>
            <p className="mt-2 text-[12px] font-mono text-[#cfcfcf]">
              You can explore the dashboard, but setup and execution are locked until payment.
            </p>
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="mt-3 px-4 py-2 border border-[#00d4aa] text-[#00d4aa] font-mono text-[11px] uppercase tracking-widest hover:bg-[#00d4aa] hover:text-[#0a0a0b]"
            >
              Pay to unlock →
            </button>
          </div>
        )}


        {/* ── Private Key ─────────────────────────────────────────────── */}
        <div className="border border-border bg-surface p-4">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
            PRIVATE KEY — in-memory only, never stored
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={privateKey}
              onChange={(e) => { setPrivateKey(e.target.value); if (pkError) validatePrivateKey(e.target.value); }}
              onBlur={() => validatePrivateKey(privateKey)}
              placeholder="0x... or 64 hex characters"
              autoComplete="off"
              spellCheck={false}
              className={`w-full bg-terminal border font-mono text-sm text-text-primary px-3 py-2 pr-10 outline-none focus:border-accent transition-colors placeholder:text-text-muted/40 ${pkError ? "border-danger" : "border-border"}`}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {pkError && <p className="mt-1 text-[11px] font-mono text-danger">{pkError}</p>}
          <p className="mt-1.5 text-[10px] font-mono text-text-muted">
            Used to deploy the contract &amp; sign distribution txs. Never written to DB or logs.
          </p>
          {walletPreview?.account && (
            <p className="mt-1 text-[10px] font-mono text-text-muted">
              Wallet: <span className="text-accent">{shortAddress(walletPreview.account)}</span>
            </p>
          )}
        </div>

        {/* ── Token Address ────────────────────────────────────────────── */}
        <div className="border border-border bg-surface p-4">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
            TOKEN ADDRESS (BEP-20 token to distribute)
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => { setTokenAddress(e.target.value); if (taError) validateTokenAddress(e.target.value); }}
            onBlur={() => validateTokenAddress(tokenAddress)}
            placeholder="0x78f9db79f53969D72262D1c45bDB387A4DE04969"
            spellCheck={false}
            className={`w-full bg-terminal border font-mono text-sm text-text-primary px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-text-muted/40 ${taError ? "border-danger" : "border-border"}`}
          />
          {taError && <p className="mt-1 text-[11px] font-mono text-danger">{taError}</p>}

          <div className="mt-3 border border-border/60 bg-terminal px-3 py-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-muted">BALANCE PREVIEW (Mainnet token + tBNB)</span>
              {previewLoading ? (
                <span className="text-warning flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> FETCHING...</span>
              ) : walletPreview ? (
                <span className="text-success">LIVE</span>
              ) : (
                <span className="text-text-muted">ENTER VALID KEY + TOKEN</span>
              )}
            </div>
            {walletPreview && (
              <div className="mt-2 space-y-1 text-[11px] font-mono">
                <p className="text-text-primary">
                  Token Name (Mainnet): <span className="text-accent">{walletPreview.token?.name ?? "Not found on mainnet"}</span>
                </p>
                <p className="text-text-primary">
                  BNB Balance (Mainnet): <span className="text-accent">{Number(walletPreview.bnbBalance).toFixed(6)} BNB</span>
                </p>
                <p className="text-text-primary">
                  tBNB Balance (Testnet): <span className="text-accent">{Number(walletPreview.tBnbBalance).toFixed(6)} tBNB</span>
                </p>
                <p className="text-text-primary">
                  Token Balance (Mainnet): <span className="text-accent">{Number(walletPreview.token?.balance ?? "0").toLocaleString()} {walletPreview.token?.symbol ?? ""}</span>
                </p>
                {walletPreview.tokenError && (
                  <p className="text-warning">Token check (mainnet): {walletPreview.tokenError}</p>
                )}
                {!walletPreview.tokenOnSelectedNetwork && (
                  <p className="text-warning">
                    Note: token contract not found on {selectedNetworkLabel}. Mainnet token preview is shown for reference.
                  </p>
                )}
              </div>
            )}
            {previewError && (
              <p className="mt-2 text-[11px] font-mono text-warning">
                Could not fetch balance preview for this key/token/network.
              </p>
            )}
          </div>
        </div>

        {/* ── MultiSender Deploy Block ──────────────────────────────────── */}
        <div className="border border-border bg-surface">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted">
                MULTISENDER CONTRACT
              </span>
              {deployedAddress && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-success">
                  <CheckCircle size={11} />
                  {deployNetwork ? deployNetwork.toUpperCase() : "DEPLOYED"}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] font-mono text-text-muted">
              This contract batches token transfers. Deploy once per chain — reuse forever.
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* If already deployed — show address card */}
            {deployedAddress && !showManualInput && (
              <div className="border border-success/30 bg-success/5 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={13} className="text-success flex-shrink-0" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-success">
                    Contract Ready
                  </span>
                </div>
                <p className="font-mono text-sm text-text-primary break-all">{deployedAddress}</p>
                {deployNetwork && (
                  <p className="mt-1 text-[10px] font-mono text-text-muted">
                    Network: <span className="text-accent">{deployNetwork}</span>
                  </p>
                )}
              </div>
            )}

            {/* Network selector + Deploy button */}
            <div className="flex gap-3">
              {/* Network tabs */}
              <div className="flex border border-border">
                {NETWORKS.map((n) => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => setSelectedNetwork(n.value)}
                    className={`px-3 py-2 text-[11px] font-mono uppercase tracking-wide transition-colors ${
                      selectedNetwork === n.value
                        ? "bg-accent text-black"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {n.label}
                    <span className="ml-1 opacity-60 text-[9px]">({n.chainId})</span>
                  </button>
                ))}
              </div>

              {/* Deploy button */}
              <button
                type="button"
                onClick={handleDeploy}
                disabled={deploying || !canUseSetup}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-accent text-accent font-mono text-[11px] uppercase tracking-widest hover:bg-accent hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deploying ? (
                  <><Loader2 size={13} className="animate-spin" /> DEPLOYING...</>
                ) : (
                  <><Zap size={13} /> {deployedAddress ? "REDEPLOY" : "DEPLOY"} TO {NETWORKS.find(n => n.value === selectedNetwork)?.label.toUpperCase()}</>
                )}
              </button>
            </div>

            {deploying && (
              <div className="border border-warning/30 bg-warning/5 px-3 py-2">
                <p className="text-[11px] font-mono text-warning animate-pulse">
                  ⏳ Deploying to blockchain... this takes 30–60 seconds. Do not close the page.
                </p>
              </div>
            )}

            {/* Toggle: use existing / manual address */}
            <button
              type="button"
              onClick={() => { setShowManualInput((v) => !v); setMsError(""); }}
              className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted hover:text-accent transition-colors"
            >
              {showManualInput ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showManualInput ? "Hide manual input" : "Already have a MultiSender address? Enter it manually"}
            </button>

            {/* Manual address input */}
            {showManualInput && (
              <div>
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => { setManualAddress(e.target.value); if (msError) validateManualAddress(e.target.value); }}
                  onBlur={() => validateManualAddress(manualAddress)}
                  placeholder="0xefd81f8ecc135ed2ed8dcaab4ec76282ffbf0d3c"
                  spellCheck={false}
                  className={`w-full bg-terminal border font-mono text-sm text-text-primary px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-text-muted/40 ${msError ? "border-danger" : "border-border"}`}
                />
                {msError && <p className="mt-1 text-[11px] font-mono text-danger">{msError}</p>}
                <p className="mt-1.5 text-[10px] font-mono text-text-muted">
                  Paste your already-deployed MultiSender contract address.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Wallet Count ─────────────────────────────────────────────── */}
        <div className="border border-border bg-surface p-4">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
            TOTAL WALLETS — {totalWallets.toLocaleString()}
          </label>
          <div className="mb-3">
            <input
              type="number"
              min={1}
              max={100000}
              value={totalWalletsInput}
              onChange={(e) => handleWalletsNumberChange(e.target.value)}
              onBlur={(e) => handleWalletsNumberChange(e.target.value || "1")}
              className="w-full bg-terminal border border-border font-mono text-sm text-text-primary px-3 py-2 outline-none focus:border-accent"
            />
            <p className="mt-1 text-[10px] font-mono text-text-muted">Type wallet count directly (1 to 100,000)</p>
          </div>
          <input
            type="range"
            min="1"
            max="100000"
            step="1"
            value={totalWallets}
            onChange={(e) => setTotalWallets(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-mono text-text-muted">1</span>
            <span className="text-[11px] font-mono text-accent font-bold">
              {totalWallets.toLocaleString()} wallets
            </span>
            <span className="text-[10px] font-mono text-text-muted">100,000</span>
          </div>
          <div className="mt-3 border border-border/60 bg-terminal px-3 py-2 text-[11px] font-mono space-y-1">
            <p className="text-text-muted">Estimated token needed for random 1–100 per wallet:</p>
            <p className="text-text-primary">Min: <span className="text-accent">{requiredMin.toLocaleString()}</span></p>
            <p className="text-text-primary">Avg: <span className="text-accent">{requiredAvg.toLocaleString()}</span></p>
            <p className="text-text-primary">Max: <span className="text-accent">{requiredMax.toLocaleString()}</span></p>
            {walletPreview && (
              <p className={hasEnoughForMax ? "text-success" : "text-warning"}>
                {hasEnoughForMax
                  ? "Token balance is enough for max-case distribution."
                  : "Token balance may be insufficient for max-case distribution."}
              </p>
            )}
          </div>
        </div>

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading || configLoading || !multisenderAddress || !canUseSetup}
          className="w-full py-3 border border-accent text-accent font-mono text-sm uppercase tracking-widest hover:bg-accent hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> INITIALIZING...</>
          ) : !multisenderAddress ? (
            "DEPLOY MULTISENDER FIRST →"
          ) : (
            "INITIALIZE SESSION →"
          )}
        </button>
      </form>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xl border border-accent bg-surface">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-widest text-accent">
                Confirm Session Details
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-text-muted hover:text-text-primary font-mono text-xs"
              >
                CLOSE
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm font-mono">
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-text-muted">Private Key</span>
                <span className="text-text-primary">{maskPrivateKey(privateKey.trim())}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-text-muted">Token Address</span>
                <span className="text-text-primary">{shortAddress(tokenAddress.trim())}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-text-muted">Token Name</span>
                <span className="text-text-primary">{tokenName}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-text-muted">MultiSender</span>
                <span className="text-text-primary">{shortAddress(multisenderAddress.trim())}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-text-muted">Network</span>
                <span className="text-text-primary">
                  {selectedNetworkLabel}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">Total Wallets</span>
                <span className="text-accent font-bold">{totalWallets.toLocaleString()}</span>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-border text-text-muted hover:text-text-primary font-mono text-xs uppercase"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={createSession}
                disabled={loading}
                className="px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-black font-mono text-xs uppercase disabled:opacity-40"
              >
                {loading ? "Creating..." : "Confirm & Initialize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
