import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  requirePlan?: boolean;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requirePlan = true, requireAdmin = false }: Props) {
  const { user, subscription, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border border-[#00d4aa] border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-[#6b6b6b] uppercase tracking-widest">Loading session</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = user.role === "ADMIN";

  if (requirePlan !== false && !isAdmin && subscription?.status !== "ACTIVE") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
