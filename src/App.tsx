import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import Shell from "@/components/layout/Shell";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/Login";
import OnboardingPage from "@/pages/Onboarding";
import PaymentResult from "@/pages/PaymentResult";
import AccountPage from "@/pages/Account";

import SetupPage from "@/pages/SetupPage";
import GeneratePage from "@/pages/GeneratePage";
import PlanPage from "@/pages/PlanPage";
import DistributePage from "@/pages/DistributePage";
import ResultsPage from "@/pages/ResultsPage";
import HistoryPage from "@/pages/HistoryPage";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminPayments from "@/pages/admin/AdminPayments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requirePlan={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requirePlan={false}>
                <Shell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="setup" replace />} />
            <Route path="setup" element={<SetupPage />} />
            <Route path="generate" element={<GeneratePage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="distribute" element={<DistributePage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>

          <Route
            path="/account"
            element={
              <ProtectedRoute requirePlan={false}>
                <Shell />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin requirePlan={false}>
                <Shell />
              </ProtectedRoute>
            }
          >
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111113",
              color: "#e8e8e8",
              border: "1px solid #1f1f23",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
              borderRadius: "4px",
            },
            success: {
              iconTheme: { primary: "#00d4aa", secondary: "#0a0a0b" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#0a0a0b" },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
