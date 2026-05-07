import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Layers,
  List,
  Play,
  Download,
  History,
  UserCircle,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { store } from "@/lib/store";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { to: "/dashboard/setup", icon: Settings, label: "SETUP", requiresPlan: false },
  { to: "/dashboard/generate", icon: Layers, label: "GENERATE", requiresPlan: true },
  { to: "/dashboard/plan", icon: List, label: "PLAN", requiresPlan: true },
  { to: "/dashboard/distribute", icon: Play, label: "DISTRIBUTE", requiresPlan: true },
  { to: "/dashboard/results", icon: Download, label: "RESULTS", requiresPlan: false },
  { to: "/dashboard/history", icon: History, label: "HISTORY", requiresPlan: false },
] as const;

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  if (p.length === 0) return "?";
  return (p[0][0] ?? "?").toUpperCase() + ((p[1]?.[0] ?? "") as string).toUpperCase();
}

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = store.getSessionId();
  const { user, subscription } = useAuth();

  const planActive = subscription?.status === "ACTIVE";
  const canAccessPlanFeatures = planActive || user?.role === "ADMIN";

  const toastStyle = useMemo(
    () => ({
      style: {
        background: "#111113",
        color: "#e8e8e8",
        border: "1px solid #1f1f23",
        fontFamily: '"JetBrains Mono", monospace',
      },
    }),
    []
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-200 ease-in-out",
        "bg-surface border-r border-border",
        expanded ? "w-52" : "w-14"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center h-14 px-3 border-b border-border overflow-hidden gap-2">
        <div className="w-6 h-6 rounded-none bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-black text-xs font-mono font-bold">B</span>
        </div>
        {expanded && user ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-panel border border-border">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-accent">
                  {initials(user.name)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-mono text-text-primary truncate max-w-[140px]">{user.name}</p>
              {canAccessPlanFeatures ? (
                <span className="inline-flex text-[9px] font-mono text-accent border border-accent px-1.5 py-0.5 rounded-none mt-0.5">
                  {user?.role === "ADMIN" ? "ADMIN" : subscription?.planKey}
                </span>
              ) : (
                <button
                  type="button"
                  className="text-[9px] font-mono text-danger border border-danger px-1.5 py-0.5 rounded-none mt-0.5"
                  onClick={() => navigate("/onboarding")}
                >
                  NO PLAN
                </button>
              )}
            </div>
          </div>
        ) : expanded ? (
          <span className="ml-1 text-xs font-mono uppercase tracking-widest text-text-primary whitespace-nowrap">
            BNB DIST
          </span>
        ) : null}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, requiresPlan }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={(e) => {
                if (
                  requiresPlan &&
                  !canAccessPlanFeatures
                ) {
                  e.preventDefault();
                  toast.error("No active plan. Upgrade to continue.", toastStyle);
                }
              }}
              className={cn(
                "flex items-center h-10 px-4 gap-3 relative transition-colors duration-150",
                "text-text-muted hover:text-text-primary hover:bg-panel",
                isActive && "text-accent border-l-2 border-accent bg-accent-dim"
              )}
            >
              {isActive && !expanded && (
                <span className="absolute left-0 top-0 h-full w-0.5 bg-accent" />
              )}
              <Icon size={16} className="flex-shrink-0" />
              {expanded && (
                <span className="text-[11px] font-mono uppercase tracking-widest whitespace-nowrap">
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="border-t border-border my-2 mx-3" />

        <NavLink
          to="/account"
          className={cn(
            "flex items-center h-10 px-4 gap-3 relative transition-colors duration-150",
            "text-text-muted hover:text-text-primary hover:bg-panel",
            location.pathname === "/account" && "text-accent border-l-2 border-accent bg-accent-dim"
          )}
        >
          <UserCircle size={18} className="flex-shrink-0" />
          {expanded && (
            <span className="text-[11px] font-mono uppercase tracking-widest whitespace-nowrap">Account</span>
          )}
        </NavLink>

        {user?.role === "ADMIN" && (
          <NavLink
            to="/admin"
            className={cn(
              "flex items-center h-10 px-4 gap-3 relative transition-colors duration-150",
              "text-text-muted hover:text-text-primary hover:bg-panel",
              location.pathname.startsWith("/admin") && "text-accent border-l-2 border-accent bg-accent-dim"
            )}
          >
            <Shield size={18} className="flex-shrink-0" />
            {expanded && (
              <span className="text-[11px] font-mono uppercase tracking-widest whitespace-nowrap">Admin</span>
            )}
          </NavLink>
        )}
      </nav>

      <div className="border-t border-border p-4 overflow-hidden">
        {sessionId ? (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 animate-pulse-slow" />
            {expanded && (
              <span className="text-[10px] font-mono text-text-muted truncate">
                {sessionId.slice(-8)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted flex-shrink-0" />
            {expanded && (
              <span className="text-[10px] font-mono text-text-muted">NO SESSION</span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
