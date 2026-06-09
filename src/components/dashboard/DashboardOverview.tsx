import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, TrendingUp, Clock, Award, CheckCircle2, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { useNavigate } from 'react-router-dom';
import { BonusCard } from './BonusCard';
import { WithdrawModal } from './WithdrawModal';
import { toast } from '@/lib/toast';

const DashboardOverview = () => {
  const { user, profile } = useAuth();
  const { isApproved } = useKYCStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [investmentStatus, setInvestmentStatus] = useState<'Active' | 'Settlement Pending' | 'Inactive'>('Inactive');
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    totalProfit: 0,
    daysActive: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    highestDeposit: 0,
  });

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch all base data in parallel to avoid database query waterfalls
        const [balanceRes, depositsRes, withdrawalsRes, investmentsRes, plansRes] = await Promise.all([
          supabase
            .from('account_balances')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('deposits')
            .select('amount')
            .eq('user_id', user.id)
            .eq('status', 'completed'),
          supabase
            .from('withdrawals')
            .select('amount')
            .eq('user_id', user.id)
            .eq('status', 'completed'),
          supabase
            .from('investments')
            .select('*, investment_plans(name, min_amount)')
            .eq('user_id', user.id),
          supabase
            .from('investment_plans')
            .select('*')
            .eq('is_active', true)
            .order('min_amount')
        ]);

        const balanceData = balanceRes.data;
        const deposits = depositsRes.data;
        const withdrawals = withdrawalsRes.data;
        const investments = investmentsRes.data;
        const plansData = plansRes.data || [];

        setAllPlans(plansData);

        if (balanceData) {
          setBalance(balanceData);
          
          // Calculate days active
          const accountCreated = new Date(balanceData.account_active_since);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - accountCreated.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setStats(prev => ({
            ...prev,
            daysActive: diffDays,
          }));
        }

        const totalDeposited = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
        const highestDeposit = deposits?.reduce((max, d) => Math.max(max, Number(d.amount)), 0) || 0;

        // Resolve current plan (override takes precedence)
        let resolvedPlanName = null;
        if (profile?.current_plan_override_id) {
          const { data: overridePlan } = await supabase
            .from('investment_plans')
            .select('name')
            .eq('id', profile.current_plan_override_id)
            .maybeSingle();
          if (overridePlan) {
            resolvedPlanName = overridePlan.name;
          }
        }

        if (!resolvedPlanName && investments && investments.length > 0) {
          const highestTierInvestment = [...investments].sort((a, b) => {
            const planA = (a as any).investment_plans;
            const planB = (b as any).investment_plans;
            return (planB?.min_amount || 0) - (planA?.min_amount || 0);
          })[0];
          resolvedPlanName = (highestTierInvestment as any).investment_plans?.name || null;
        }

        setCurrentPlan(resolvedPlanName);

        let resolvedStatus: 'Active' | 'Settlement Pending' | 'Inactive' = 'Inactive';
        if (investments) {
          const activeInvs = investments.filter(i => i.status === 'active');
          
          const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
          const totalProfit = investments.reduce((sum, i) => {
            if (i.status === 'completed') {
              return sum + Number(i.expected_profit);
            }
            return sum;
          }, 0);

          const now = new Date();
          const hasSettlementPending = activeInvs.some(i => new Date(i.end_date) <= now);
          const hasRunningActive = activeInvs.some(i => new Date(i.end_date) > now);

          if (hasSettlementPending) {
            resolvedStatus = 'Settlement Pending';
          } else if (hasRunningActive) {
            resolvedStatus = 'Active';
          }

          setStats(prev => ({
            ...prev,
            totalInvested,
            activeInvestments: activeInvs.length,
            totalProfit,
            totalDeposited,
            totalWithdrawn,
            highestDeposit,
          }));
        } else {
          setStats(prev => ({
            ...prev,
            totalDeposited,
            totalWithdrawn,
            highestDeposit,
          }));
        }
        setInvestmentStatus(resolvedStatus);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up Real-time Subscriptions (SSE-style WebSockets via Supabase)
    if (user?.id) {
      const channel = supabase
        .channel('dashboard-overview-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'account_balances', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.new) setBalance(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          () => fetchData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${user.id}` },
          () => fetchData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'investment_plans' },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const mainBal = balance ? Number(balance.main_balance) : 0;
    if (amount > mainBal) {
      toast.error('Insufficient balance in main wallet');
      return;
    }

    setTransferring(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const newMainBalance = mainBal - amount;
      const newInvestmentBalance = (balance ? Number(balance.investment_balance) : 0) + amount;

      const { error } = await supabase
        .from('account_balances')
        .update({
          main_balance: newMainBalance,
          investment_balance: newInvestmentBalance,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log the transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'transfer',
        amount: -amount,
        description: 'Transfer from Main Wallet to Investment Wallet',
        status: 'completed',
      });

      setBalance({
        ...balance,
        main_balance: newMainBalance,
        investment_balance: newInvestmentBalance,
      });

      toast.success(`$${amount.toFixed(2)} transferred to Investment Wallet`);
      setTransferAmount('');
      setShowTransferModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const getGrowthPlanStatus = () => {
    if (allPlans.length === 0) {
      return { 
        unlocked: [], 
        locked: [], 
        currentPlanIndex: -1, 
        progressToNext: 0, 
        nextPlan: null,
        planSteps: ['Starter', 'Platinum', 'Executive', 'Apex'] 
      };
    }

    const unlocked = allPlans.filter(p => stats.highestDeposit >= p.min_amount);
    const locked = allPlans.filter(p => stats.highestDeposit < p.min_amount);
    
    const currentIndex = currentPlan
      ? allPlans.findIndex(p => p.name.toLowerCase() === currentPlan.toLowerCase() || currentPlan.toLowerCase().includes(p.name.toLowerCase()))
      : -1;

    const nextPlan = locked.length > 0 ? locked[0] : null;

    let progressToNext = 0;
    if (nextPlan) {
      const currentMin = currentIndex >= 0 ? allPlans[currentIndex].min_amount : 0;
      const range = nextPlan.min_amount - currentMin;
      const currentProgress = stats.highestDeposit - currentMin;
      progressToNext = range > 0 ? Math.min(100, Math.max(0, (currentProgress / range) * 100)) : 0;
    }

    return { 
      unlocked, 
      locked, 
      currentPlanIndex: currentIndex, 
      progressToNext, 
      nextPlan,
      planSteps: allPlans.map(p => p.name.replace(' PLAN', ''))
    };
  };

  const { 
    unlocked: unlockedPlans, 
    locked: lockedPlans, 
    currentPlanIndex, 
    progressToNext, 
    nextPlan,
    planSteps
  } = getGrowthPlanStatus();

  return (
    <>
      {/* Welcome Section */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <h1 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-1.5">
            Welcome back, {loading ? <span className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block align-middle" /> : (profile?.full_name || 'User')}
          </h1>
          {isApproved && !loading && (
            <span className="material-symbols-outlined text-secondary text-[22px] translate-y-[1px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold tracking-wider uppercase">
            {loading ? (
              <span className="h-3 w-20 bg-slate-200/20 dark:bg-slate-800/20 rounded animate-pulse inline-block" />
            ) : (
              `Active for ${stats.daysActive} days`
            )}
          </div>
        </div>
      </section>

      {/* SpaceX Promo Banner */}
      <section 
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 relative overflow-hidden shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform active:scale-95"
        onClick={() => navigate('/dashboard/spacex')}
      >
        <div className="absolute right-[-10px] top-[-10px] opacity-20">
          <span className="material-symbols-outlined text-[100px]">rocket_launch</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Premium</span>
            <span className="text-white/90 text-xs font-medium">Age 40+ Only</span>
          </div>
          <h3 className="text-white font-bold text-lg leading-tight mb-1">Space X Retirement Funds</h3>
          <p className="text-blue-100 text-xs">Secure your future with our exclusive weekly payout program.</p>
        </div>
      </section>

      {/* Main Account Overview Card - AT THE TOP */}
      <section className="glass-card rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-5xl">payments</span>
        </div>
        <p className="text-on-surface-variant font-label-md uppercase tracking-widest text-[10px]">Total Combined Balance</p>
        <h2 className="text-2xl font-bold text-primary mt-1">
          {loading ? (
            <span className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
          ) : (
            `$${(Number(balance?.main_balance || 0) + Number(balance?.profit_balance || 0)).toFixed(2)}`
          )}
        </h2>
        
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase">Main Wallet</p>
              <div className="text-lg font-bold text-primary mt-0.5">
                {loading ? (
                  <span className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
                ) : (
                  `$${Number(balance?.main_balance || 0).toFixed(2)}`
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-[10px] uppercase">Investment Wallet</p>
              <div className="text-lg font-bold text-primary mt-0.5">
                {loading ? (
                  <span className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
                ) : (
                  `$${Number(balance?.investment_balance || 0).toFixed(2)}`
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 font-['Plus_Jakarta_Sans']">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase">Active Investments</p>
              <div className="text-base font-bold text-primary mt-0.5">
                {loading ? (
                  <span className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
                ) : (
                  `$${stats.totalInvested.toFixed(2)}`
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-[10px] uppercase">Total Profit Returns</p>
              <div className="text-base font-bold text-secondary mt-0.5">
                {loading ? (
                  <span className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
                ) : (
                  `$${balance?.profit_balance ? Number(balance.profit_balance).toFixed(2) : '0.00'}`
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Status Card */}
      <section className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 text-lg">donut_large</span>
            Investment Status
          </h3>
          {loading ? (
            <span className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              investmentStatus === 'Active' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50' 
                : investmentStatus === 'Settlement Pending'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                investmentStatus === 'Active' 
                  ? 'bg-emerald-500 animate-pulse' 
                  : investmentStatus === 'Settlement Pending'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-400'
              }`}></span>
              {investmentStatus}
            </span>
          )}
        </div>

        <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed mb-4">
          {loading ? (
            <span className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse block" />
          ) : (
            <>
              {investmentStatus === 'Active' && 'Your investment is currently active and generating returns.'}
              {investmentStatus === 'Settlement Pending' && 'Your investment term has concluded and proceeds are available for claim'}
              {investmentStatus === 'Inactive' && 'There are currently no active investment positions in your portfolio'}
            </>
          )}
        </p>

        {!loading && (
          <div className="flex gap-2">
            {investmentStatus === 'Active' && (
              <Button 
                onClick={() => navigate('/dashboard/investments')} 
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Manage Investments
              </Button>
            )}
            {investmentStatus === 'Settlement Pending' && (
              <Button 
                onClick={() => navigate('/dashboard/investments')} 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/10"
              >
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                Claim Proceeds
              </Button>
            )}
            {investmentStatus === 'Inactive' && (
              <Button 
                onClick={() => navigate('/dashboard/plans')} 
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Start Investing
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Quick Actions - BELOW THE CARD */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-primary px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button 
            onClick={() => setShowTransferModal(true)} 
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-white dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl font-bold active:scale-95 transition-all duration-200 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">swap_horiz</span>
            </div>
            <span className="text-[11px] text-primary dark:text-white">Transfer</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard/deposit')} 
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-primary text-white rounded-xl font-bold active:scale-95 transition-all duration-200 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">add_circle</span>
            </div>
            <span className="text-[11px]">Deposit</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard/plans')} 
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-primary text-white rounded-xl font-bold active:scale-95 transition-all duration-200 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">trending_up</span>
            </div>
            <span className="text-[11px]">Invest</span>
          </button>
          <button 
            onClick={() => setShowWithdrawModal(true)} 
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-white dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl font-bold active:scale-95 transition-all duration-200 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[18px]">account_balance_wallet</span>
            </div>
            <span className="text-[11px] text-primary dark:text-white">Withdraw</span>
          </button>
        </div>
      </section>

      {/* Investment Plan / Growth Plan Section */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-primary">Your Growth Plan</h3>
          <button onClick={() => window.location.href = '/dashboard/plans'} className="text-secondary font-bold text-[11px]">View All Plans</button>
        </div>
        
        {loading ? (
          <div className="bg-primary-container text-on-primary-fixed-variant rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col gap-3">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="material-symbols-outlined text-5xl">military_tech</span>
            </div>
            <div className="flex justify-between items-start z-10">
              <div className="space-y-1">
                <span className="bg-secondary-container/20 text-on-secondary-container px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-secondary-container/30">Current Tier</span>
                <div className="h-5 w-32 bg-white/20 rounded animate-pulse mt-1" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 animate-pulse" />
            </div>
            <div className="h-10 w-full bg-white/10 rounded-full animate-pulse mt-2" />
          </div>
        ) : (
          <div className="bg-primary-container text-on-primary-fixed-variant rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="material-symbols-outlined text-5xl">military_tech</span>
            </div>
            
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="bg-secondary-container/20 text-on-secondary-container px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-secondary-container/35">
                  CURRENT TIER
                </span>
                <h4 className="text-white text-lg font-extrabold mt-2 font-['Plus_Jakarta_Sans'] tracking-wide uppercase">
                  {currentPlan || 'NO ACTIVE PLAN'}
                </h4>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <span className="material-symbols-outlined text-white text-xl">rocket_launch</span>
              </div>
            </div>

            {/* Plan Progression Widget */}
            <div className="mt-2 pt-4 border-t border-white/10 z-10 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-white font-['Plus_Jakarta_Sans']">TIER PROGRESSION</p>
              <div className="relative px-2 py-2">
                {/* Connecting Lines */}
                <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0"></div>
                <div 
                  className="absolute left-6 top-5 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-500"
                  style={{ 
                    width: `${currentPlanIndex >= 0 ? (currentPlanIndex / (planSteps.length - 1)) * 100 : 0}%`, 
                    left: '1.5rem', 
                    right: '1.5rem', 
                    maxWidth: 'calc(100% - 3rem)' 
                  }}
                ></div>
                
                {/* Steps */}
                <div className="flex justify-between items-center relative z-10">
                  {planSteps.map((step, idx) => (
                    <div key={step} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        idx <= currentPlanIndex 
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        idx <= currentPlanIndex ? 'text-white' : 'text-white/50'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deposit-Based Progress Bar to Next Plan */}
            {nextPlan && (
              <div className="space-y-1.5 z-10 pt-2 border-t border-white/10">
                <div className="flex justify-between text-[10px] text-white/80 font-bold uppercase tracking-wide">
                  <span>Upgrade Progress</span>
                  <span>Max Deposit: ${stats.highestDeposit.toLocaleString()} / ${nextPlan.min_amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-secondary h-full rounded-full transition-all duration-700" 
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-white/60 leading-normal">
                  Make a single deposit of at least <strong>${nextPlan.min_amount.toLocaleString()}</strong> to unlock the <strong>{nextPlan.name}</strong>.
                </p>
              </div>
            )}

            {/* Unlocked Tiers vs Locked Tiers list */}
            <div className="pt-3.5 border-t border-white/10 z-10 space-y-3 font-['Plus_Jakarta_Sans']">
              <div className="grid grid-cols-2 gap-4">
                {/* Unlocked Plans */}
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/60 mb-1.5">Unlocked Plans</p>
                  <div className="flex flex-col gap-1">
                    {unlockedPlans.length === 0 ? (
                      <span className="text-[10px] text-white/40 italic">None (Min $200)</span>
                    ) : (
                      unlockedPlans.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-1 text-[10px] font-bold text-white">
                          <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                          {p.name.replace(' PLAN', '')}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Plans Yet To Unlock */}
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/60 mb-1.5">Yet to Unlock</p>
                  <div className="flex flex-col gap-1">
                    {lockedPlans.length === 0 ? (
                      <span className="text-[10px] text-green-300 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">military_tech</span>
                        All plans unlocked!
                      </span>
                    ) : (
                      lockedPlans.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-1 text-[10px] font-bold text-white/50" title={`Requires $${p.min_amount} total deposits`}>
                          <span className="material-symbols-outlined text-white/30 text-sm">lock</span>
                          <span>{p.name.replace(' PLAN', '')}</span>
                          <span className="text-[8px] opacity-75 font-normal">(${p.min_amount.toLocaleString()})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = '/dashboard/plans?upgrade=true'} 
              className="w-full bg-white text-primary py-3 rounded-full font-bold text-sm active:scale-95 transition-all mt-1 z-10 hover:bg-slate-50 shadow-md shadow-black/10"
            >
              Upgrade Plan
            </button>
          </div>
        )}
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-secondary text-base">south_west</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Deposits</span>
          </div>
          <div className="text-base font-bold text-primary">
            {loading ? (
              <span className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
            ) : (
              `$${stats.totalDeposited.toFixed(2)}`
            )}
          </div>
        </div>
        
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-error text-base">north_east</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Withdrawals</span>
          </div>
          <div className="text-base font-bold text-primary">
            {loading ? (
              <span className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
            ) : (
              `$${stats.totalWithdrawn.toFixed(2)}`
            )}
          </div>
        </div>
        
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-secondary text-base">trending_up</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Invested</span>
          </div>
          <div className="text-base font-bold text-primary">
            {loading ? (
              <span className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
            ) : (
              `$${stats.totalInvested.toFixed(2)}`
            )}
          </div>
        </div>
        
        <div className="glass-card p-3 rounded-xl bg-tertiary-fixed/10 border-tertiary-fixed/30 font-['Plus_Jakarta_Sans']">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-on-tertiary-container text-base">monitoring</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Total Profit</span>
          </div>
          <div className="text-base font-bold text-on-tertiary-container">
            {loading ? (
              <span className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse inline-block" />
            ) : (
              `+$${stats.totalProfit.toFixed(2)}`
            )}
          </div>
        </div>
      </section>

      {/* Bonus Card Component if applicable */}
      <BonusCard />

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md bg-surface border-slate-200 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Transfer Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
              <p className="text-sm text-blue-800 leading-relaxed">
                Transfer funds from your <strong>Main Wallet</strong> to your <strong>Investment Wallet</strong> to purchase investment plans.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1">From: Main Wallet</p>
                <p className="text-lg font-bold text-primary">${balance ? Number(balance.main_balance).toFixed(2) : '0.00'}</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/50">
                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-1">To: Investment</p>
                <p className="text-lg font-bold text-primary">${balance ? Number(balance.investment_balance).toFixed(2) : '0.00'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant ml-1">Amount (USD)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="font-headline-md text-on-surface-variant group-focus-within:text-primary transition-colors">$</span>
                </div>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max={balance ? Number(balance.main_balance) : 0}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-white border-2 border-outline-variant rounded-2xl py-4 pl-10 pr-4 font-headline-md focus:border-primary focus:ring-0 transition-all placeholder:text-outline-variant" 
                  placeholder="0.00"
                />
              </div>
              {balance && (
                <button 
                  type="button"
                  onClick={() => setTransferAmount(Number(balance.main_balance).toString())}
                  className="text-xs text-secondary font-bold ml-1 hover:underline"
                >
                  Transfer Max: ${Number(balance.main_balance).toFixed(2)}
                </button>
              )}
            </div>

            <button 
              onClick={handleTransfer}
              disabled={transferring || !transferAmount || parseFloat(transferAmount) <= 0}
              className="w-full py-4 bg-primary text-white font-headline-md rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {transferring ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Transferring...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">swap_horiz</span>
                  Transfer to Investment Wallet
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <WithdrawModal 
        isOpen={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)} 
      />
    </>
  );
};

export default DashboardOverview;
