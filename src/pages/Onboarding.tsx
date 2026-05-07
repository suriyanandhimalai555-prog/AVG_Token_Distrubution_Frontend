import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import CoinbaseCheckout from "@/components/CoinbaseCheckout";
import { DEX_AUTOMATION_PLANS, TOKEN_HOLDER_PLANS, findPlan } from "@shared/plans";
import { parseLandingPlan } from "@/lib/planQuery";
import type { ProductLine } from "@shared/plans";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const { subscription, user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [product, setProduct] = useState<ProductLine>("TOKEN_HOLDER");
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingPlan");
    const p = parseLandingPlan(raw);
    if (p && p.productLine === "TOKEN_HOLDER") {
      setProduct(p.productLine);
      setSelectedKey(p.planKey);
      setStep(2);
    }
  }, []);

  if (user?.role === "ADMIN" || subscription?.status === "ACTIVE") {
    return <Navigate to="/dashboard" replace />;
  }

  const selectedPlan = useMemo(() => {
    if (!selectedKey) return null;
    return findPlan(product, selectedKey);
  }, [product, selectedKey]);

  const priceUSD =
    selectedPlan && "priceUSD" in selectedPlan ? (selectedPlan.priceUSD as number) : 0;
  const priceINR =
    selectedPlan && "priceINR" in selectedPlan ? (selectedPlan.priceINR as number) : 0;
  const planName = selectedPlan && "name" in selectedPlan ? String(selectedPlan.name) : "";

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e8e8e8] font-mono px-4 pb-28 pt-10 max-w-5xl mx-auto">
      <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest mb-6">
        Step {step} / 3 — Signed in as {user?.email}
      </p>

      <div className="flex gap-6 border-b border-[#1f1f23] mb-8">
        {(["CHOOSE PRODUCT", "CHOOSE PLAN", "CHECKOUT"] as const).map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          return (
            <div
              key={label}
              className={`pb-3 px-1 text-[11px] uppercase tracking-widest border-b-2 -mb-px ${
                active ? "text-[#00d4aa] border-[#00d4aa]" : "text-[#6b6b6b] border-transparent"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <>
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => setProduct("TOKEN_HOLDER")}
              className={`text-left border p-6 rounded-none transition-colors ${
                product === "TOKEN_HOLDER"
                  ? "border-[#00d4aa] bg-[#00d4aa08]"
                  : "border-[#1f1f23] hover:border-[#6b6b6b]"
              }`}
            >
              <p className="text-[11px] text-[#6b6b6b] uppercase tracking-widest">Product</p>
              <p className="text-lg uppercase tracking-wide mt-2">TOKEN HOLDER CREATION</p>
              <p className="text-sm text-[#6b6b6b] mt-2 font-sans">
                One-time setup. Permanent holder base.
              </p>
              <p className="text-sm text-[#00d4aa] mt-4">From ₹5,000 (~$60)</p>
            </button>
            {/* DEX onboarding card hidden for now; logic/data intentionally kept. */}
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-8 px-8 py-3 border border-[#00d4aa] text-[#00d4aa] uppercase tracking-widest hover:bg-[#00d4aa] hover:text-[#0a0a0b]"
          >
            NEXT →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          >
            {(product === "TOKEN_HOLDER" ? TOKEN_HOLDER_PLANS : TOKEN_HOLDER_PLANS).map((p) => {
              const pk = String(p.key);
              const active = selectedKey === pk;
              const pop = "popular" in p && p.popular;
              return (
                <button
                  key={pk}
                  type="button"
                  onClick={() => setSelectedKey(pk)}
                  className={`border p-5 text-left rounded-none ${
                    active ? "border-[#00d4aa]" : "border-[#1f1f23]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span>{p.emoji}</span>
                    <span className="font-bold">{p.name}</span>
                    {pop && (
                      <span className="ml-auto text-[9px] border border-[#00d4aa] text-[#00d4aa] px-1.5 py-0.5 uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  {"priceUSD" in p && (
                    <>
                      {"oldPriceUSD" in p && p.oldPriceUSD != null ? (
                        <p className="text-[#6b6b6b] text-xs line-through mt-2">${Number(p.oldPriceUSD)}/mo</p>
                      ) : null}
                      <p className="text-2xl mt-2">
                        ${(p as { priceUSD: number }).priceUSD}
                        {"billingCycle" in p ? " /month" : ""}
                      </p>
                      <p className="text-[#6b6b6b] text-xs">~₹{(p as { priceINR: number }).priceINR.toLocaleString()} INR</p>
                    </>
                  )}
                  <ul className="mt-4 space-y-1 text-[11px] text-[#6b6b6b] font-sans list-none">
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-[#00d4aa]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-[#1f1f23] text-[#6b6b6b] uppercase text-xs hover:text-[#e8e8e8]"
            >
              ← BACK
            </button>
            <button
              type="button"
              disabled={!selectedKey}
              onClick={() => selectedKey && setStep(3)}
              className="px-6 py-2 border border-[#00d4aa] text-[#00d4aa] uppercase text-xs disabled:opacity-40 hover:bg-[#00d4aa] hover:text-[#0a0a0b]"
            >
              NEXT →
            </button>
          </div>
        </>
      )}

      {step === 3 && selectedPlan && "priceUSD" in selectedPlan && (
        <>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-3 border border-[#1f1f23] p-6 rounded-none">
              <p className="text-[10px] text-[#6b6b6b] uppercase tracking-widest">Selected plan</p>
              <p className="text-2xl mt-2">{planName}</p>
              <p className="text-sm text-[#6b6b6b] mt-1">{product.replace("_", " ")}</p>
              <p className="mt-4 text-[#00d4aa]">
                PRICE: ${priceUSD} USD
              </p>
              <p className="text-xs text-[#6b6b6b]">(~₹{priceINR.toLocaleString()} INR)</p>
              <hr className="border-[#1f1f23] my-4" />
              <ul className="space-y-2 text-xs text-[#6b6b6b] font-sans">
                {selectedPlan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[#00d4aa]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 border border-[#1f1f23] p-6 rounded-none">
              <div className="border border-[#00d4aa22] bg-[#00d4aa08] p-4 mb-6">
                <p className="text-sm text-[#00d4aa]">PAY WITH CRYPTO</p>
                <p className="text-xs text-[#6b6b6b] mt-1">ETH · USDC · BTC · DAI · USDT · DOGE · LTC</p>
                <p className="text-xs text-[#6b6b6b] mt-1">
                  Powered by Coinbase Commerce · Self-custody settlement
                </p>
              </div>
              <CoinbaseCheckout
                productLine={product}
                planKey={selectedKey}
                planName={planName}
                priceUSD={priceUSD}
                onInitiated={() => toast.success("Redirecting to Coinbase payment...")}
                onError={(m) => toast.error(m)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-8 px-6 py-2 border border-[#1f1f23] text-[#6b6b6b] uppercase text-xs"
          >
            ← BACK
          </button>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#1f1f23] bg-[#0a0a0b] p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-[#6b6b6b]">
          Selected: {planName || "—"} · ${priceUSD || "—"} USD
        </span>
        {step === 3 && selectedKey && priceUSD > 0 && (
          <div className="max-w-xs w-full">
            <CoinbaseCheckout
              compact
              productLine={product}
              planKey={selectedKey}
              planName={planName}
              priceUSD={priceUSD}
              onInitiated={() => toast.success("Redirecting to Coinbase payment...")}
              onError={(m) => toast.error(m)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
