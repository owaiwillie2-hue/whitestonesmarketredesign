import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ModalProvider } from "./contexts/ModalContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from 'react';

// Lazy load pages for bundle optimization & code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Cryptocurrencies = lazy(() => import("./pages/Cryptocurrencies"));
const Markets = lazy(() => import("./pages/Markets"));
const RealEstate = lazy(() => import("./pages/RealEstate"));
const OilAndGas = lazy(() => import("./pages/OilAndGas"));
const NFT = lazy(() => import("./pages/NFT"));
const RetirementLoan = lazy(() => import("./pages/RetirementLoan"));
const InvestmentsPage = lazy(() => import("./pages/Investments"));
const Company = lazy(() => import("./pages/Company"));
const DashboardOverview = lazy(() => import("./components/dashboard/DashboardOverview"));
const Deposit = lazy(() => import("./pages/dashboard/Deposit"));
const Transactions = lazy(() => import("./pages/dashboard/Transactions"));
const Investments = lazy(() => import("./pages/dashboard/Investments"));
const Plans = lazy(() => import("./pages/dashboard/Plans"));
const Invest = lazy(() => import("./pages/dashboard/Invest"));
const InvestmentPreview = lazy(() => import("./pages/dashboard/InvestmentPreview"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const Referrals = lazy(() => import("./pages/dashboard/Referrals"));
const KYC = lazy(() => import("./pages/dashboard/KYC"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const ActivityLog = lazy(() => import("./pages/dashboard/ActivityLog"));
const WithdrawalAccounts = lazy(() => import("./pages/dashboard/WithdrawalAccounts"));
const SpaceXRetirement = lazy(() => import("./pages/dashboard/SpaceXRetirement"));
const Admin = lazy(() => import("./pages/admin/Admin"));
const AdminPage = lazy(() => import("./pages/admin/Admin")); // Fallback/alias if needed
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
const AdminUsersPlans = lazy(() => import("./pages/admin/UsersPlans"));
const AdminDeposits = lazy(() => import("./pages/admin/Deposits"));
const AdminWithdrawals = lazy(() => import("./pages/admin/Withdrawals"));
const AdminKYC = lazy(() => import("./pages/admin/KYC"));
const AdminReferrals = lazy(() => import("./pages/admin/Referrals"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminInvestments = lazy(() => import("./pages/admin/Investments"));
const AdminActivityLogs = lazy(() => import("./pages/admin/ActivityLogs"));
const AdminInvestmentPlans = lazy(() => import("./pages/admin/InvestmentPlans"));
const AdminBonus = lazy(() => import("./pages/admin/Bonus"));
const UserNotifications = lazy(() => import("./pages/dashboard/Notifications"));
const SpaceXAdmin = lazy(() => import("./pages/admin/SpaceXAdmin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 2,
    },
  },
});

const PageLoader = () => null;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/email-confirmation" element={<EmailConfirmation />} />
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
                <Route path="users-plans" element={<AdminUsersPlans />} />
                <Route path="deposits" element={<AdminDeposits />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="bonus" element={<AdminBonus />} />
                <Route path="investment-plans" element={<AdminInvestmentPlans />} />
                <Route path="kyc" element={<AdminKYC />} />
                <Route path="referrals" element={<AdminReferrals />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="activity-logs" element={<AdminActivityLogs />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="investments" element={<AdminInvestments />} />
              </Route>
              
              <Route path="/admin/spacex" element={<ProtectedRoute requireAdmin><SpaceXAdmin /></ProtectedRoute>} />
              
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
                <Route path="spacex" element={<SpaceXRetirement />} />
                <Route path="activity" element={<ActivityLog />} />
                <Route path="withdrawal-accounts" element={<WithdrawalAccounts />} />
                <Route path="notifications" element={<UserNotifications />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
