import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ModalProvider } from "./contexts/ModalContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import TidioChat from "./components/Tidio";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Cryptocurrencies from "./pages/Cryptocurrencies";
import Markets from "./pages/Markets";
import RealEstate from "./pages/RealEstate";
import OilAndGas from "./pages/OilAndGas";
import NFT from "./pages/NFT";
import RetirementLoan from "./pages/RetirementLoan";
import InvestmentsPage from "./pages/Investments";
import Company from "./pages/Company";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import Deposit from "./pages/dashboard/Deposit";
import Transactions from "./pages/dashboard/Transactions";
import Investments from "./pages/dashboard/Investments";
import Plans from "./pages/dashboard/Plans";
import Invest from "./pages/dashboard/Invest";
import InvestmentPreview from "./pages/dashboard/InvestmentPreview";
import Profile from "./pages/dashboard/Profile";
import Referrals from "./pages/dashboard/Referrals";
import KYC from "./pages/dashboard/KYC";
import Settings from "./pages/dashboard/Settings";
import ActivityLog from "./pages/dashboard/ActivityLog";
import WithdrawalAccounts from "./pages/dashboard/WithdrawalAccounts";
import Admin from "./pages/admin/Admin";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminDeposits from "./pages/admin/Deposits";
import AdminWithdrawals from "./pages/admin/Withdrawals";
import AdminKYC from "./pages/admin/KYC";
import AdminReferrals from "./pages/admin/Referrals";
import AdminNotifications from "./pages/admin/Notifications";
import AdminSettings from "./pages/admin/Settings";
import AdminInvestments from "./pages/admin/Investments";
import AdminActivityLogs from "./pages/admin/ActivityLogs";
import AdminInvestmentPlans from "./pages/admin/InvestmentPlans";
import AdminBonus from "./pages/admin/Bonus";
import UserNotifications from "./pages/dashboard/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ModalProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
          <Sonner />
          <BrowserRouter>
            <TidioChat />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/cryptocurrencies" element={<Cryptocurrencies />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/real-estate" element={<RealEstate />} />
              <Route path="/oil-and-gas" element={<OilAndGas />} />
              <Route path="/nft" element={<NFT />} />
              <Route path="/retirement" element={<RetirementLoan />} />
              <Route path="/loan" element={<RetirementLoan />} />
              <Route path="/company" element={<Company />} />
              
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>}>
                <Route index element={<AdminAnalytics />} />
                <Route path="dashboard" element={<AdminAnalytics />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:userId" element={<AdminUserDetail />} />
                <Route path="deposits" element={<AdminDeposits />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="bonus" element={<AdminBonus />} />
                <Route path="investment-plans" element={<AdminInvestmentPlans />} />
                <Route path="kyc" element={<AdminKYC />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="activity-logs" element={<AdminActivityLogs />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                <Route index element={<DashboardOverview />} />
                <Route path="deposit" element={<Deposit />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="investments" element={<Investments />} />
                <Route path="plans" element={<Plans />} />
                <Route path="invest" element={<Invest />} />
                <Route path="profile" element={<Profile />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="kyc" element={<KYC />} />
                <Route path="settings" element={<Settings />} />
                <Route path="activity" element={<ActivityLog />} />
                <Route path="withdrawal-accounts" element={<WithdrawalAccounts />} />
                <Route path="notifications" element={<UserNotifications />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ModalProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
