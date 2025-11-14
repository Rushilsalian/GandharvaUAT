import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginForm } from "@/components/LoginForm";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { PaymentForm } from "@/components/PaymentForm";
import { TransactionTable } from "@/components/DataTable";
import { ClientManagementPage } from "@/pages/ClientManagementPage";
import { BranchForm } from "@/components/BranchForm";
import { RolesPage } from "@/components/RolesPage";
import { UsersPage } from "@/components/UsersPage";
import Dashboard from "@/pages/Dashboard";
import ImportPage from "@/pages/ImportPage";
import ReportsPage from "@/pages/ReportsPage";
import InvestmentPage from "@/pages/InvestmentPage";
import WithdrawalPage from "@/pages/WithdrawalPage";
import PayoutPage from "@/pages/PayoutPage";
import ClosurePage from "@/pages/ClosurePage";
import MyInvestmentsPage from "@/pages/client/MyInvestmentsPage";
import MyWithdrawalsPage from "@/pages/client/MyWithdrawalsPage";
import MyPayoutsPage from "@/pages/client/MyPayoutsPage";
import MyClosuresPage from "@/pages/client/MyClosuresPage";
import WithdrawalRequestPage from "@/pages/WithdrawalRequestPage";
import InvestmentRequestPage from "@/pages/InvestmentRequestPage";
import ReferralRequestPage from "@/pages/ReferralRequestPage";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";
import NotFound from "@/pages/not-found";
import PaymentCallbackPage from "@/pages/PaymentCallbackPage";
import OffersPage from "@/pages/OffersPage";
import ContentManagementPage from "@/pages/ContentManagementPage";
import { useSessionExpiration } from "@/hooks/useSessionExpiration";
import { setGlobalSessionHandlers } from "@/lib/api";
import { apiClient } from "@/lib/apiClient";
import { SessionGuard } from "@/components/SessionGuard";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

function Router({ userRole, isLoggedIn, onLogin, onSignup }: { userRole: "admin" | "leader" | "client", isLoggedIn: boolean, onLogin?: (email: string, password: string) => Promise<void>, onSignup?: (email: string, password: string, name: string) => Promise<void> }) {
  const { client } = useAuth();
  const clientId = client?.id;

  //todo: remove mock functionality - replace with real transaction and client data
  const mockTransactions = [
    { date: "2024-01-15", clientName: "John Doe", type: "investment", amount: 50000, status: "completed" },
    { date: "2024-01-14", clientName: "Jane Smith", type: "payout", amount: 5000, status: "pending" },
    { date: "2024-01-13", clientName: "Bob Wilson", type: "withdrawal", amount: 25000, status: "completed" },
    { date: "2024-01-12", clientName: "Alice Johnson", type: "investment", amount: 75000, status: "completed" },
  ];

  const mockClients = [
    { name: "John Doe", email: "john@example.com", mobile: "+91-9876543210", branch: "Mumbai", totalInvestment: 150000, joinDate: "2023-06-15" },
    { name: "Jane Smith", email: "jane@example.com", mobile: "+91-9876543211", branch: "Delhi", totalInvestment: 85000, joinDate: "2023-08-22" },
    { name: "Bob Wilson", email: "bob@example.com", mobile: "+91-9876543212", branch: "Bangalore", totalInvestment: 120000, joinDate: "2023-04-10" },
    { name: "Alice Johnson", email: "alice@example.com", mobile: "+91-9876543213", branch: "Chennai", totalInvestment: 95000, joinDate: "2023-09-05" },
  ];

  if (!isLoggedIn) {
    return (
      <Switch>
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/" component={() => <LoginForm onLogin={onLogin} onSignup={onSignup} />} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => <Dashboard userRole={userRole} />} />
      <Route path="/dashboard" component={() => <Dashboard userRole={userRole} />} />
      
      {/* Admin Routes */}
      {userRole === "admin" && (
        <>
          <Route path="/branches" component={() => <BranchForm />} />
          <Route path="/clients" component={() => <ClientManagementPage />} />
          <Route path="/roles" component={() => <RolesPage />} />
          <Route path="/users" component={() => <UsersPage />} />
          <Route path="/import" component={() => <ImportPage />} />
          <Route path="/investments" component={() => <InvestmentPage />} />
          <Route path="/withdrawals" component={() => <WithdrawalPage />} />
          <Route path="/payouts" component={() => <PayoutPage />} />
          <Route path="/closures" component={() => <ClosurePage />} />
          <Route path="/withdrawal-request" component={() => <WithdrawalRequestPage />} />
          <Route path="/investment-request" component={() => <InvestmentRequestPage />} />
          <Route path="/referral-request" component={() => <ReferralRequestPage />} />
          <Route path="/content-management" component={() => <ContentManagementPage />} />
        </>
      )}
      
      {/* Client Routes */}
      {userRole === "client" && (
        <>
          <Route path="/my-investments" component={() => <MyInvestmentsPage clientId={clientId || ""} />} />
          <Route path="/my-withdrawals" component={() => <MyWithdrawalsPage clientId={clientId || ""} />} />
          <Route path="/my-payouts" component={() => <MyPayoutsPage clientId={clientId || ""} />} />
          <Route path="/my-closures" component={() => <MyClosuresPage clientId={clientId || ""} />} />
          <Route path="/withdraw" component={() => <WithdrawalForm />} />
          <Route path="/payments" component={() => <PaymentForm />} />
        </>
      )}
      
      {/* Common Routes */}
      <Route path="/reports" component={() => <ReportsPage />} />
      <Route path="/payment-callback" component={() => <PaymentCallbackPage />} />
      <Route path="/offers" component={() => <OffersPage />} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoggedIn, login, signup, logout } = useAuth();
  const { handleSessionExpired, handleUnauthorized } = useSessionExpiration();

  // Set up global session handlers
  useEffect(() => {
    setGlobalSessionHandlers(handleSessionExpired, handleUnauthorized);
    apiClient.setSessionHandlers(handleSessionExpired, handleUnauthorized);
  }, [handleSessionExpired, handleUnauthorized]);

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    await signup(email, password, name);
  };

  // Custom sidebar width for better content display
  const style = {
    "--sidebar-width": "14rem",       // 224px for compact sidebar
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        {!isLoggedIn ? (
          <Router userRole={user?.role || "admin"} isLoggedIn={isLoggedIn} onLogin={handleLogin} onSignup={handleSignup} />
        ) : (
          <SessionGuard>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex w-full">
                <AppSidebar userRole={user?.role || "admin"} onLogout={logout} />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-auto p-3">
                    <Router userRole={user?.role || "admin"} isLoggedIn={isLoggedIn} onLogin={handleLogin} onSignup={handleSignup} />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </SessionGuard>
        )}
        <Toaster />
        <PWAInstallPrompt />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
