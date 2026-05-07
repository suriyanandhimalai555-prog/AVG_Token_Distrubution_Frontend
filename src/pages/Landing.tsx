import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { TOKEN_HOLDER_PLANS, DEX_AUTOMATION_PLANS } from "@shared/plans";

const LOG_LINES = [
  "[14:32:01] Batch 324/500 | 200 wallets | TX: 0xabc…def ✓ CONFIRMED",
  "[14:32:04] Batch 325/500 | 200 wallets | TX: 0xefg…hij ✓ CONFIRMED",
  "[14:32:07] Batch 326/500 | 200 wallets | PENDING…",
  "[14:32:10] Batch 327/500 | 200 wallets | TX: 0xklm…nop ✓ CONFIRMED",
  "[14:32:13] Batch 328/500 | 200 wallets | TX: 0xqrs…tuv ✓ CONFIRMED",
];

export default function Landing() {
  const [lineIdx, setLineIdx] = useState(0);
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIdx((i) => i + 1);
    }, 600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const slice: string[] = [];
    for (let k = 0; k < 6; k++) {
      slice.push(LOG_LINES[(lineIdx + k) % LOG_LINES.length]);
    }
    setVisible(slice);
  }, [lineIdx]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] font-mono text-[#e8e8e8]">
      <section className="min-h-[100vh] flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:w-[55%] max-w-[640px]">
          <p className="text-[11px] text-[#6b6b6b] uppercase tracking-widest">
            BNB CHAIN · BSC TESTNET · WEB3 INFRASTRUCTURE
          </p>
          <h1 className="mt-6 leading-tight uppercase font-bold tracking-tight text-[clamp(32px,5vw,64px)] font-mono">
            Token Distribution<br />at Scale.
          </h1>
          <p className="font-sans text-base text-[#6b6b6b] max-w-lg mt-6 leading-relaxed">
            Generate tens of thousands of wallets. Distribute tokens in batches. Track every transaction live.
            Export proof in one click.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              to="/login"
              className="border border-[#00d4aa] text-[#00d4aa] font-mono uppercase tracking-widest px-8 py-3 rounded-none hover:bg-[#00d4aa] hover:text-[#0a0a0b] transition-all"
            >
              GET STARTED FREE →
            </Link>
            <Link
              to="/pricing"
              className="border border-[#1f1f23] text-[#6b6b6b] font-mono uppercase tracking-widest px-8 py-3 rounded-none hover:border-[#e8e8e8] hover:text-[#e8e8e8]"
            >
              VIEW PRICING
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-16">
            {[
              ["100K", "WALLETS PER SESSION"],
              ["500", "MULTISENDER BATCH SIZE"],
              ["30%+", "GAS HEADROOM DESIGN"],
              ["24H", "TARGET DELIVERY"],
            ].map(([n, label]) => (
              <div key={label}>
                <p className="text-2xl lg:text-3xl font-bold text-[#00d4aa]">{n}</p>
                <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mt-2 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[45%] items-center justify-center px-12 py-16">
          <div className="relative w-full max-w-lg bg-[#111113] border border-[#1f1f23] overflow-hidden rounded-none shadow-none">
            <div className="py-2 px-4 border-b border-[#1f1f23] flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="ml-auto text-[11px] text-[#6b6b6b] font-mono">distribution.ts</span>
            </div>
            <div className="relative p-4 h-64 overflow-hidden font-mono text-[13px] leading-6 leading-relaxed font-mono">
              <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(transparent 0px,#00000010 4px,#00000010 8px,#00000020 12px,#00000020 14px,#00000000 16px)] bg-[length:100%_4px]" />
              {visible.map((line) => (
                <p key={line} className={`${line.includes("PENDING") ? "text-[#f59e0b]" : "text-[#22c55e]"}`}>
                  {line}
                </p>
              ))}
              <span className="text-[#00d4aa] animate-pulse">█</span>
            </div>
          </div>
        </div>
      </section>

      {/* Moved to /pricing for now (kept in code, not deleted). */}
      {/*
      <section className="py-24 px-6 border-t border-[#1f1f23] max-w-6xl mx-auto">
        <div className="border border-[#1f1f23] hover:border-[#00d4aa]/20 p-8 transition-colors rounded-none">
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
          <Link
            to="/pricing?tab=holder"
            className="inline-flex mt-6 text-xs uppercase tracking-widest border border-[#1f1f23] px-4 py-2 text-[#6b6b6b] hover:border-[#00d4aa] hover:text-[#00d4aa]"
          >
            VIEW PACKAGES →
          </Link>
        </div>

        
      </section>
      */}

      {/* Moved to /pricing for now (kept in code, not deleted). */}
      {/*
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-[#1f1f23]">
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
        <p className="text-center text-[#00d4aa] text-sm font-mono mt-8 flex flex-wrap justify-center gap-2 px-4">
          💎 Pay with crypto · ETH · USDC · BTC · DAI · USDT · and more
        </p>
        <p className="text-center text-[11px] text-[#6b6b6b] font-mono mt-2">Powered by Coinbase Commerce</p>
      </section>
      */}

      {/* <section className="py-24 px-6 bg-[#111113] border-t border-[#1f1f23]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-mono uppercase tracking-widest text-xl text-[#e8e8e8]">DEX AUTOMATION — MONTHLY</h2>
          <p className="font-sans text-sm text-[#6b6b6b] mt-2">Active subscription · Renews monthly.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {DEX_AUTOMATION_PLANS.map((p) => {
              const oldP = Number(p.oldPriceUSD);
              const save = Math.max(0, Math.round((1 - p.priceUSD / oldP) * 100));
              const pop = "popular" in p && p.popular;
              return (
                <div key={p.key} className={`border p-8 rounded-none ${pop ? "border-[#00d4aa]" : "border-[#1f1f23]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-lg uppercase tracking-wide">
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </div>
                    {pop && (
                      <span className="text-[10px] text-[#00d4aa] border border-[#00d4aa] px-2 py-0.5 uppercase whitespace-nowrap">
                        MOST POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-[#6b6b6b] text-sm line-through mt-3">${oldP}/mo</p>
                  <div className="flex flex-wrap items-baseline gap-2 mt-1">
                    <p className="font-mono text-3xl text-[#e8e8e8]">${p.priceUSD}</p>
                    <span className="font-sans text-[#6b6b6b] text-sm">/month</span>
                    <span className="text-[10px] font-mono border border-[#22c55e] text-[#22c55e] px-2 py-0.5">
                      SAVE {save}%
                    </span>
                  </div>
                  <p className="text-[#6b6b6b] text-xs font-mono mt-1">₹{p.priceINR.toLocaleString()}/month</p>
                  <div className="grid grid-cols-2 gap-2 mt-6 text-[11px] font-mono text-[#9a9a9a] uppercase">
                    <span>WALLETS: {p.wallets}</span>
                    <span>BOTS: {p.bots}</span>
                    <span>MIN FREQ: {p.minFrequency}</span>
                    <span>MAX TX/DAY: {Number(p.maxTxPerDay).toLocaleString()}</span>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs text-[#6b6b6b] font-sans">
                        <span className="text-[#00d4aa]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`/login?plan=DEX_${p.key}`}
                    className="mt-6 block text-center uppercase text-xs font-mono border border-[#00d4aa] text-[#00d4aa] py-3 hover:bg-[#00d4aa] hover:text-[#0a0a0b]"
                  >
                    SUBSCRIBE →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section> */}

      <footer className="border-t border-[#1f1f23] pt-14 pb-16 px-6 mt-24">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
          <div>
            <p className="font-mono font-bold text-[#e8e8e8]">TOKENDIST</p>
            <p className="text-[#6b6b6b] font-mono text-xs mt-2">
              Professional Web3 distribution infrastructure
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-10 gap-y-3 font-mono text-xs uppercase text-[#9a9a9a]">
            <Link to="/" className="hover:text-[#00d4aa]">
              HOME
            </Link>
            <Link to="/pricing" className="hover:text-[#00d4aa]">
              PRICING
            </Link>
            <Link to="/dashboard" className="hover:text-[#00d4aa]">
              DASHBOARD
            </Link>
          </nav>
          <div>
            <p className="font-mono text-[#6b6b6b] text-xs">ETH · USDC · BTC · DAI · USDT</p>
            <p className="text-[10px] text-[#6b6b6b] font-mono mt-2">Powered by Coinbase Commerce</p>
          </div>
        </div>
        <p className="mt-12 pt-6 border-t border-[#1f1f23] text-center text-[11px] text-[#6b6b6b] font-mono max-w-4xl mx-auto">
          BEP20 · ERC20 · Polygon · For token distribution and Web3 utility purposes only.
        </p>
      </footer>
    </div>
  );
}
