import { Link } from "react-router-dom";
import { TOKEN_HOLDER_PLANS, DEX_AUTOMATION_PLANS } from "@shared/plans";

export default function Pricing() {
  const tab: "holder" | "dex" = "holder";

  const pro = TOKEN_HOLDER_PLANS.find((p) => "popular" in p && p.popular) ?? TOKEN_HOLDER_PLANS[3];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e8e8e8] font-mono px-4 md:px-8 py-14">
      <div className="max-w-[1100px] mx-auto mb-14">
        <Link to="/" className="text-[11px] text-[#00d4aa] uppercase hover:underline">
          ← Home
        </Link>
      </div>

      <div className="max-w-[1100px] mx-auto border-b border-[#1f1f23] flex font-mono text-sm uppercase tracking-widest mb-10">
        <button
          type="button"
          className="px-6 py-4 border-b-2 -mb-px rounded-none bg-transparent uppercase font-mono border-[#00d4aa] text-[#00d4aa]"
        >
          Token holder creation
        </button>
        {/* DEX tab hidden for now; logic/data intentionally kept in source. */}
      </div>

      {
        <>
          <section className="max-w-[1100px] mx-auto border border-[#1f1f23] hover:border-[#00d4aa]/20 p-8 transition-colors rounded-none mb-8">
            <div className="h-[48px] w-[48px] border border-[#1f1f23] rounded-none mb-6 flex items-center justify-center bg-[#00d4aa11] overflow-hidden">
              <svg viewBox="0 0 48 48" width="48" height="48">
                {Array.from({ length: 12 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={10 + (i % 4) * 10}
                    cy={10 + Math.floor(i / 4) * 10}
                    r={3}
                    fill="#00d4aa"
                    opacity={0.25 + ((i % 5) / 10) * 0.65}
                  />
                ))}
              </svg>
            </div>
            <h3 className="font-mono uppercase tracking-widest text-lg">TOKEN HOLDER CREATION</h3>
            <p className="font-sans text-sm text-[#6b6b6b] mt-3">
              Build your holder base. Generate wallets and distribute tokens with custom or random amounts. Full Excel report included.
            </p>
            <p className="text-sm text-[#00d4aa] mt-4">Up to 25,000 wallets · From ₹5,000 (~$60)</p>
          </section>

          <section className="py-4 max-w-[1100px] mx-auto mb-10">
            <h2 className="font-mono uppercase tracking-widest text-xl">TOKEN HOLDER CREATION — PACKAGES</h2>
            <p className="text-[#6b6b6b] font-mono text-sm mt-2 font-sans">One-time setup. Permanent holder base.</p>
            <div className="flex gap-4 overflow-x-auto pb-6 mt-8">
              {TOKEN_HOLDER_PLANS.map((p) => (
                <div
                  key={p.key}
                  className={`min-w-[260px] border flex-shrink-0 p-6 rounded-none flex flex-col ${
                    "popular" in p && p.popular ? "border-[#00d4aa]" : "border-[#1f1f23]"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>{p.emoji}</span>
                      <span className="font-bold">{p.name}</span>
                    </div>
                    {"popular" in p && p.popular && (
                      <span className="text-[9px] text-[#00d4aa] border border-[#00d4aa] px-2 py-0.5 whitespace-nowrap h-fit uppercase">
                        MOST POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold mt-4 font-mono">₹{(p.priceINR as number).toLocaleString()}</p>
                  <p className="text-[#6b6b6b] text-xs font-mono">~${p.priceUSD} USD</p>
                  <p className="font-mono text-sm text-[#00d4aa] mt-2">{p.holderCount.toLocaleString()} WALLETS</p>
                  <hr className="border-[#1f1f23] my-4" />
                  <ul className="space-y-2 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs text-[#6b6b6b] font-sans">
                        <span className="text-[#00d4aa] shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-[#6b6b6b] italic mt-4">{p.bestFor}</p>
                  <Link
                    to={`/login?plan=TOKEN_HOLDER_${p.key}`}
                    className={`mt-6 w-full py-3 text-center uppercase text-xs tracking-widest border font-mono ${
                      "popular" in p && p.popular
                        ? "bg-[#00d4aa] text-[#0a0a0b] border-[#00d4aa]"
                        : "border-[#00d4aa] text-[#00d4aa]"
                    }`}
                  >
                    SELECT PLAN →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <div className="hidden md:block max-w-[1100px] mx-auto overflow-x-auto">
            <table className="w-full border-collapse font-mono text-sm">
              <thead>
                <tr className="bg-[#111113] text-[#9a9a9a]">
                  <th className="border border-[#1f1f23] px-4 py-3 text-left uppercase text-[11px]">Feature</th>
                  {TOKEN_HOLDER_PLANS.map((p) => (
                    <th
                      key={p.key}
                      className={`border border-[#1f1f23] px-4 py-3 uppercase text-[11px] ${
                        p.key === pro.key ? "bg-[#00d4aa11] text-[#00d4aa]" : ""
                      }`}
                    >
                      {p.name.replace(" Pack", "").toUpperCase()}
                      {"popular" in p && p.popular ? " ★" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableRowMulti label="Wallets" values={TOKEN_HOLDER_PLANS.map((p) => p.holderCount.toLocaleString())} accentKey={String(pro.key)} />
                <TableRowMulti label="Price (USD)" values={TOKEN_HOLDER_PLANS.map((p) => `$${p.priceUSD}`)} accentKey={String(pro.key)} />
                <TableRowMulti label="Price (INR)" values={TOKEN_HOLDER_PLANS.map((p) => `₹${p.priceINR.toLocaleString()}`)} accentKey={String(pro.key)} />
                <TableRowTransfer accentKey={String(pro.key)} />
                <TableRowDaily accentKey={String(pro.key)} />
                <RowYesNoMulti label="Excel report" allYes accentKey={String(pro.key)} />
                <RowYesNoMulti label="TX proof" allYes accentKey={String(pro.key)} />
                <TableRowDelivery accentKey={String(pro.key)} />
              </tbody>
              <tbody>
                <tr>
                  <td className="border border-[#1f1f23] py-6 px-4" />
                  {TOKEN_HOLDER_PLANS.map((plan) => (
                    <td
                      key={plan.key}
                      className={`border border-[#1f1f23] align-top px-3 py-4 ${
                        plan.key === pro.key ? "bg-[#00d4aa08]" : ""
                      }`}
                    >
                      <Link
                        to={`/login?plan=TOKEN_HOLDER_${plan.key}`}
                        className={`block text-center uppercase text-[11px] py-3 border font-bold tracking-wide ${
                          plan.key === pro.key
                            ? "bg-[#00d4aa] text-black border-[#00d4aa]"
                            : "border-[#00d4aa] text-[#00d4aa] hover:bg-[#00d4aa] hover:text-black"
                        }`}
                      >
                        Select
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid gap-4 max-w-xl mx-auto">
            {TOKEN_HOLDER_PLANS.map((p) => (
              <div key={p.key} className={`border border-[#1f1f23] p-6 ${ "popular" in p && p.popular ? "border-[#00d4aa]" : ""}`}>
                <p className="text-accent font-bold">{p.emoji} {p.name}</p>
                <p className="mt-3 text-xl">₹{p.priceINR.toLocaleString()}</p>
                <Link to={`/login?plan=TOKEN_HOLDER_${p.key}`} className="mt-6 block border border-accent text-accent text-xs uppercase py-3 text-center">
                  Select →
                </Link>
              </div>
            ))}
          </div>
        </>
      }

      <CoinbaseBanner />
      <FeatureGrid />

      <div className="max-w-[1100px] mx-auto mt-20 space-y-2">
        {[
          {
            q: "How are wallets generated?",
            a: "Using ethers.js HD wallet derivation with BIP44 (m/44'/60'/0'/0/index) from a secure master mnemonic—the same derivation model used widely across Ethereum-compatible wallets.",
          },
          {
            q: "Is my private key stored on your servers?",
            a: "Private keys stay in-memory in your authenticated browser tab for signing workflows and are designed not to persist in MongoDB or server logs.",
          },
          {
            q: "What cryptocurrencies can I pay with?",
            a: "ETH, USDC, BTC, DAI, USDT, DOGE, LTC and more via Coinbase Commerce.",
          },
          {
            q: "How long does crypto confirmation take?",
            a: "Stablecoins often confirm in ~1–3 minutes on L1/L2 rails; BTC can take from minutes to longer depending on network fees and mempool conditions.",
          },
          {
            q: "Can I upgrade later?",
            a: "Yes—open Account and run through onboarding again with a higher package; your Mongo sessions remain attached to your user record.",
          },
        ].map((item) => (
          <details key={item.q} className="group border border-[#1f1f23] bg-[#111113]/40 rounded-none">
            <summary className="font-mono text-sm px-6 py-4 cursor-pointer list-none uppercase tracking-wide text-[#e8e8e8] [&::-webkit-details-marker]:hidden hover:text-accent transition-colors relative after:content-['+'] after:absolute after:right-6 after:top-4 after:text-[#00d4aa] group-open:after:rotate-45">
              <span>{item.q}</span>
            </summary>
            <div className="px-8 pb-5 font-mono text-xs text-[#6b6b6b] leading-relaxed border-t border-[#1f1f23] pt-4">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function CoinbaseBanner() {
  return (
    <section className="mt-28 max-w-[1100px] mx-auto border border-[#00d4aa22] bg-[#00d4aa08] p-12">
      <h3 className="font-mono text-lg uppercase tracking-widest text-[#00d4aa]">ALL PAYMENTS IN CRYPTO</h3>
      <p className="font-mono text-[#cfcfcf] text-sm mt-4">
        ETH · USDC · BTC · DAI · USDT · DOGE · LTC · plus additional assets supported inside Coinbase Commerce.
      </p>
      <p className="font-mono text-xs text-[#6b6b6b] mt-3">
        Coinbase-hosted checkout • Self-custody settlement rails • Merchant API with signed webhooks (
        <span className="text-[#00d4aa]">no card data touches your infra</span>).
      </p>
      <Link
        to="/login"
        className="mt-10 inline-block border border-[#00d4aa] px-12 py-4 font-mono text-xs uppercase tracking-widest text-[#00d4aa] hover:bg-[#00d4aa] hover:text-[#0a0a0b]"
      >
        Create account →
      </Link>
    </section>
  );
}

function FeatureGrid() {
  const items = [
    "BEP20 / ERC20 / cross-chain reporting",
    "Signed transaction receipts",
    "CSV & Excel exports",
    "Session-scoped key handling",
    "Batch gas planning",
    "Resume-safe distribution engine",
  ];
  return (
    <div className="mt-16 max-w-[1100px] mx-auto">
      <h4 className="font-mono text-xs uppercase tracking-widest text-[#6b6b6b] mb-8">All packages include</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((label) => (
          <div key={label} className="border border-[#1f1f23] p-5 flex gap-4 items-start">
            <span className="text-[#00d4aa]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 10l4 4 8-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
              </svg>
            </span>
            <p className="font-mono text-sm text-[#cfcfcf] leading-relaxed">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRowMulti({
  label,
  values,
  accentKey,
}: {
  label: string;
  values: string[];
  accentKey: string;
}) {
  return (
    <tr className="border-[#1f1f23]">
      <td className="border border-[#1f1f23] px-4 py-3 text-[11px] text-[#6b6b6b]">{label}</td>
      {TOKEN_HOLDER_PLANS.map((p, idx) => (
        <td
          key={p.key}
          className={`border border-[#1f1f23] px-4 py-3 ${p.key === accentKey ? "bg-[#00d4aa08] text-accent" : ""}`}
        >
          {values[idx]}
        </td>
      ))}
    </tr>
  );
}

function TableRowTransfer({ accentKey }: { accentKey: string }) {
  const values = TOKEN_HOLDER_PLANS.map((p) =>
    typeof p.transferType === "string" ? p.transferType.includes("Fixed") ? "FIXED" : "CUSTOM / RANDOM" : "CUSTOM"
  );
  return <TableRowMulti label="TRANSFER STYLE" values={values} accentKey={accentKey} />;
}

function TableRowDaily({ accentKey }: { accentKey: string }) {
  return (
    <tr>
      <td className="border border-[#1f1f23] px-4 py-3 text-[11px] text-[#6b6b6b] uppercase">
        Daily batch lanes
      </td>
      {TOKEN_HOLDER_PLANS.map((p) => (
        <td
          key={p.key}
          className={`border border-[#1f1f23] px-4 py-3 ${p.key === accentKey ? "bg-[#00d4aa08]" : ""}`}
        >
          {"dailyBatch" in p ? (
            <span className="text-[#22c55e]">✓</span>
          ) : (
            <span className="text-[#ef4444]">✗</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function RowYesNoMulti({ label, allYes, accentKey }: { label: string; allYes?: boolean; accentKey: string }) {
  const values = TOKEN_HOLDER_PLANS.map(() => (allYes ? "✓" : "✗"));
  return (
    <tr>
      <td className="border border-[#1f1f23] px-4 py-3 text-[11px] text-[#6b6b6b]">{label}</td>
      {TOKEN_HOLDER_PLANS.map((p, idx) => (
        <td
          key={p.key}
          className={`border border-[#1f1f23] px-4 py-3 ${p.key === accentKey ? "bg-[#00d4aa08]" : ""}`}
        >
          <span className={values[idx] === "✓" ? "text-[#22c55e]" : "text-[#ef4444]"}>{values[idx]}</span>
        </td>
      ))}
    </tr>
  );
}

function TableRowDelivery({ accentKey }: { accentKey: string }) {
  const values = TOKEN_HOLDER_PLANS.map((p) => p.completionTime);
  return <TableRowMulti label="DELIVERY" values={values} accentKey={accentKey} />;
}
