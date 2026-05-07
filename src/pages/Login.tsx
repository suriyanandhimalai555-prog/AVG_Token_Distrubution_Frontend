import { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { parseLandingPlan } from "@/lib/planQuery";

export default function Login() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const planParam = params.get("plan");
  const nextUrl = params.get("next");

  const parsed = parseLandingPlan(planParam);

  useEffect(() => {
    if (planParam) {
      sessionStorage.setItem("pendingPlan", planParam);
    }
  }, [planParam]);

  useEffect(() => {
    if (!loading && user) {
      if (nextUrl) {
        navigate(decodeURIComponent(nextUrl), { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [loading, user, navigate, nextUrl]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center font-mono">
        <div className="w-8 h-8 border border-[#00d4aa] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-[#1f1f23] p-8 rounded-none">
        {parsed && (
          <div className="border border-[#1f1f23] p-3 mb-6 font-mono text-sm text-[#e8e8e8]">
            You selected:{" "}
            <span className="text-[#00d4aa]">{parsed.planName}</span> — ${parsed.priceUSD}
          </div>
        )}

        <p className="font-mono font-bold text-lg tracking-widest text-[#e8e8e8]">TOKENDIST</p>
        <h2 className="font-mono uppercase tracking-widest text-2xl mt-6 text-[#e8e8e8]">SIGN IN</h2>
        <p className="text-[#6b6b6b] text-sm font-mono mt-2">Continue with your Google account.</p>

        <button
          type="button"
          className="mt-8 w-full flex items-center justify-center gap-3 border border-[#1f1f23] py-3 px-4 rounded-none hover:border-[#00d4aa] hover:bg-[#00d4aa11] transition-all duration-200 font-mono text-sm text-[#e8e8e8]"
          onClick={() => {
            window.location.href = "/api/auth/google";
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <p className="mt-6 text-[11px] text-[#6b6b6b] font-mono text-center">
          Payments accepted in ETH, USDC, BTC, DAI, USDT, and more via Coinbase Commerce.
        </p>
        <p className="mt-2 text-[11px] text-[#6b6b6b] font-mono text-center">
          We access only your name and email. No posting on your behalf.
        </p>
      </div>
    </div>
  );
}
