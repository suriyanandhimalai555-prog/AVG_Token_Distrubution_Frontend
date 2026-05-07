/** Mirrors backend batch math for UI (default 100 per on-chain tx). */
export const MULTISENDER_MAX_PER_TX = 350;
export const DEFAULT_MULTI_BATCH_SIZE = 100;

export function countBatchesForWalletCount(walletCount: number, multiBatchSize: number): number {
  if (walletCount <= 0) return 0;
  const size = Math.min(MULTISENDER_MAX_PER_TX, Math.max(1, multiBatchSize));
  return Math.ceil(walletCount / size);
}
