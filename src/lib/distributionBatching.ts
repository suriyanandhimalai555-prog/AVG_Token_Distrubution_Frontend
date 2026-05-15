/** Mirrors backend tx math. BATCH_SIZE = wallets per MultiSender tx; PARALLEL_BATCHES = parallel multisend txs. */
export const MULTISENDER_MAX_PER_TX = 350;
/** Default wallets per multisend when env BATCH_SIZE is unset (matches backend `resolveMultiBatchSizeFromEnv` fallback). */
export const DEFAULT_MULTI_BATCH_SIZE = 100;

/** Fallback when preflight is unavailable — matches backend `PARALLEL_BATCHES` default and clamp. */
export const DEFAULT_PARALLEL_WORKERS = 1;
export const PARALLEL_WORKERS_MIN = 1;
export const PARALLEL_WORKERS_MAX = 10;

export function clampParallelWorkerCount(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_PARALLEL_WORKERS;
  return Math.max(PARALLEL_WORKERS_MIN, Math.min(PARALLEL_WORKERS_MAX, Math.floor(n)));
}

export function countBatchesForWalletCount(walletCount: number, multiBatchSize: number): number {
  if (walletCount <= 0) return 0;
  const size = Math.min(MULTISENDER_MAX_PER_TX, Math.max(1, multiBatchSize));
  return Math.ceil(walletCount / size);
}
