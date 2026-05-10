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
  const { user } = useAuth();
  const { isApproved } = useKYCStatus();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [balance, setBalance] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    totalProfit: 0,
    daysActive: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
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
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setUserName(profileData.full_name);
        }

        // Fetch account balance
        const { data: balanceData } = await supabase
          .from('account_balances')
          .select('*')
          .eq('user_id', user.id)
          .single();

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

        // Fetch deposits
        const { data: deposits } = await supabase
          .from('deposits')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const totalDeposited = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

        // Fetch withdrawals
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

        // Fetch investments
        const { data: investments } = await supabase
          .from('investments')
          .select('*, investment_plans(name, min_amount)')
          .eq('user_id', user.id);

        if (investments) {
          const activeInvs = investments.filter(i => i.status === 'active');
          
          // Get the highest tier investment plan from ALL investments
          if (investments.length > 0) {
            const highestTierInvestment = [...investments].sort((a, b) => {
              const planA = (a as any).investment_plans;
              const planB = (b as any).investment_plans;
              return (planB?.min_amount || 0) - (planA?.min_amount || 0);
            })[0];
            setCurrentPlan((highestTierInvestment as any).investment_plans?.name || null);
          }
          
          const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
          const totalProfit = investments.reduce((sum, i) => {
            if (i.status === 'completed') {
              return sum + Number(i.expected_profit);
            }
            return sum;
          }, 0);

          setStats(prev => ({
            ...prev,
            totalInvested,
            activeInvestments: activeInvs.length,
            totalProfit,
            totalDeposited,
            totalWithdrawn,
          }));
        } else {
          setStats(prev => ({
            ...prev,
            totalDeposited,
            totalWithdrawn,
          }));
        }
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex gap-2 items-center">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
      </div>
    );
  }

  const getPlanProgress = (planName: string | null) => {
    const plans = ['Starter', 'Platinum', 'Executive', 'Apex'];
    const currentIndex = planName ? plans.findIndex(p => planName.includes(p)) : -1;
    return { plans, currentIndex };
  };
  const { plans: planSteps, currentIndex: currentPlanIndex } = getPlanProgress(currentPlan);

  return (
    <>
      {/* Welcome Section */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <h1 className="font-headline-sm text-lg font-bold text-primary">Welcome back, {userName || 'User'}</h1>
          {isApproved && (
            <span className="material-symbols-outlined text-secondary text-[22px] translate-y-[1px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold tracking-wider uppercase">
            Active for {stats.daysActive} days
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
          ${balance ? (Number(balance.main_balance) + Number(balance.profit_balance)).toFixed(2) : '0.00'}
        </h2>
        
        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase">Main Wallet</p>
              <p className="text-lg font-bold text-primary">
                ${balance ? Number(balance.main_balance).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-[10px] uppercase">Investment Wallet</p>
              <p className="text-lg font-bold text-primary">
                ${balance ? Number(balance.investment_balance).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase">Active Investments</p>
              <p className="text-base font-bold text-primary">${stats.totalInvested.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-[10px] uppercase">Total Profit Returns</p>
              <p className="text-base font-bold text-secondary">${balance?.profit_balance ? Number(balance.profit_balance).toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </div>
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
            onClick={() => navigate('/dashboard/invest')} 
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

      {/* Investment Plan Section */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-primary">Active Plan</h3>
          <button onClick={() => window.location.href = '/dashboard/plans'} className="text-secondary font-bold text-[11px]">View All Plans</button>
        </div>
        
        {currentPlan ? (
          <div className="bg-primary-container text-on-primary-fixed-variant rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col gap-3">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <span className="material-symbols-outlined text-5xl">military_tech</span>
            </div>
            
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="bg-secondary-container/20 text-on-secondary-container px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-secondary-container/30">Current Tier</span>
                <h4 className="text-white text-lg font-bold mt-1.5">{currentPlan}</h4>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10">
                <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
              </div>
            </div>

            {/* Plan Progression Widget */}
            <div className="mt-2 pt-4 border-t border-white/10 z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-3 text-white">Tier Progression</p>
              <div className="flex justify-between items-center relative px-2 mb-2">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0"></div>
                <div 
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
                  style={{ width: `${currentPlanIndex >= 0 ? (currentPlanIndex / (planSteps.length - 1)) * 100 : 0}%`, left: '1.5rem', right: '1.5rem', maxWidth: 'calc(100% - 3rem)' }}
                ></div>
                
                {planSteps.map((step, idx) => (
                  <div key={step} className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${idx <= currentPlanIndex ? 'bg-primary text-white shadow-lg shadow-primary/50 ring-2 ring-primary-container' : 'bg-white/10 text-white/50 ring-2 ring-primary-container'}`}>
                      {idx < currentPlanIndex ? <span className="material-symbols-outlined text-[14px]">check</span> : idx + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-1">
                {planSteps.map((step, idx) => (
                  <span key={step} className={`text-[9px] font-bold uppercase tracking-wider ${idx <= currentPlanIndex ? 'text-white' : 'text-white/50'}`}>{step}</span>
                ))}
              </div>
            </div>

            <button onClick={() => window.location.href = '/dashboard/plans?upgrade=true'} className="w-full bg-white text-primary py-2.5 rounded-full font-bold text-xs active:scale-95 transition-all mt-1 z-10 hover:bg-slate-50">
              Upgrade Plan
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <p className="text-sm text-on-surface-variant mb-4">You don't have any active investment plans yet.</p>
            <button onClick={() => window.location.href = '/dashboard/plans'} className="w-full bg-primary text-white py-3 rounded-full font-bold text-sm active:scale-95 transition-all">
              Choose a Plan
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
          <p className="text-base font-bold text-primary">${stats.totalDeposited.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-error text-base">north_east</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Withdrawals</span>
          </div>
          <p className="text-base font-bold text-primary">${stats.totalWithdrawn.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-3 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-secondary text-base">trending_up</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Invested</span>
          </div>
          <p className="text-base font-bold text-primary">${stats.totalInvested.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-3 rounded-xl bg-tertiary-fixed/10 border-tertiary-fixed/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="material-symbols-outlined text-on-tertiary-container text-base">monitoring</span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">Total Profit</span>
          </div>
          <p className="text-base font-bold text-on-tertiary-container">+${stats.totalProfit.toFixed(2)}</p>
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
