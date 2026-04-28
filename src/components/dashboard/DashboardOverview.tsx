import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, Award, CheckCircle2, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import WalletsOverview from './WalletsOverview';
import { BonusCard } from './BonusCard';

const DashboardOverview = () => {
  const { user } = useAuth();
  const { isApproved } = useKYCStatus();
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
          
          // Get the highest tier active investment plan (plan with highest min_amount)
          if (activeInvs.length > 0) {
            const highestTierInvestment = activeInvs.sort((a, b) => {
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
  }, [user]);

  const statCards = [
    {
      title: 'Main Balance',
      value: `$${balance ? Number(balance.main_balance).toFixed(2) : '0.00'}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Profit Balance',
      value: `$${balance ? Number(balance.profit_balance).toFixed(2) : '0.00'}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: `Profits (${stats.daysActive}d)`,
      value: `$${stats.totalProfit.toFixed(2)}`,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Investments',
      value: stats.activeInvestments,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Section */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-headline-md text-headline-md text-primary">Welcome back, {userName || 'User'}</h1>
          {isApproved && (
            <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold tracking-wider uppercase">
            Active for {stats.daysActive} days
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 gap-4">
        <button onClick={() => window.location.href = '/dashboard/deposit'} className="flex items-center justify-center gap-2 py-4 bg-secondary-container text-on-secondary-container rounded-xl font-bold active:scale-95 transition-all duration-200 shadow-sm">
          <span className="material-symbols-outlined">add_circle</span>
          <span>Deposit</span>
        </button>
        <button onClick={() => window.location.href = '/dashboard/withdraw'} className="flex items-center justify-center gap-2 py-4 bg-white border border-outline-variant text-primary rounded-xl font-bold active:scale-95 transition-all duration-200 shadow-sm">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span>Withdraw</span>
        </button>
      </section>

      {/* Main Account Overview */}
      <section className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-6xl">payments</span>
        </div>
        <p className="text-on-surface-variant font-label-md uppercase tracking-widest text-[10px]">Total Combined Balance</p>
        <h2 className="text-display-lg font-display-lg text-primary mt-1">
          ${balance ? (Number(balance.main_balance) + Number(balance.profit_balance) + stats.totalInvested).toFixed(2) : '0.00'}
        </h2>
        
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-on-surface-variant text-xs">Main Wallet</p>
              <p className="text-headline-md font-headline-md text-primary">
                ${balance ? Number(balance.main_balance).toFixed(2) : '0.00'}
              </p>
            </div>
            <button onClick={() => window.location.href = '/dashboard/invest'} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">
              Invest Now
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-on-surface-variant text-xs">Active Investments</p>
              <p className="text-body-lg font-bold text-primary">${stats.totalInvested.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-on-surface-variant text-xs">Profit Balance</p>
              <p className="text-body-lg font-bold text-on-tertiary-container">+${balance ? Number(balance.profit_balance).toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plan Section */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-headline-md text-primary">Active Plan</h3>
          <button onClick={() => window.location.href = '/dashboard/plans'} className="text-secondary font-bold text-sm">View All Plans</button>
        </div>
        
        {currentPlan ? (
          <div className="bg-primary-container text-on-primary-fixed-variant rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-secondary-container/20 text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-secondary-container/30">Current Tier</span>
                <h4 className="text-white text-2xl font-bold mt-2 font-display-lg">{currentPlan}</h4>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-3xl">rocket_launch</span>
              </div>
            </div>
            <button onClick={() => window.location.href = '/dashboard/plans?upgrade=true'} className="w-full bg-white text-primary py-3 rounded-xl font-bold text-sm active:scale-95 transition-all mt-4">
              Upgrade Plan
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <p className="text-sm text-on-surface-variant mb-4">You don't have any active investment plans yet.</p>
            <button onClick={() => window.location.href = '/dashboard/plans'} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm active:scale-95 transition-all">
              Choose a Plan
            </button>
          </div>
        )}
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-lg">south_west</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Deposits</span>
          </div>
          <p className="text-xl font-bold text-primary">${stats.totalDeposited.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-error text-lg">north_east</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Withdrawals</span>
          </div>
          <p className="text-xl font-bold text-primary">${stats.totalWithdrawn.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-lg">trending_up</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Invested</span>
          </div>
          <p className="text-xl font-bold text-primary">${stats.totalInvested.toFixed(2)}</p>
        </div>
        
        <div className="glass-card p-4 rounded-2xl bg-tertiary-fixed/10 border-tertiary-fixed/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-on-tertiary-container text-lg">monitoring</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Total Profit</span>
          </div>
          <p className="text-xl font-bold text-on-tertiary-container">+${stats.totalProfit.toFixed(2)}</p>
        </div>
      </section>

      {/* Bonus Card Component if applicable */}
      <BonusCard />

      {/* Placeholder for analytics trend */}
      <section className="glass-card rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="font-bold text-primary">Earnings Overview</p>
          <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
        </div>
        <div className="h-32 w-full bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
          <svg className="w-full h-full stroke-secondary fill-none stroke-[3] overflow-visible" viewBox="0 0 400 100">
            <path d="M0 80 Q 50 70, 100 85 T 200 40 T 300 60 T 400 20" strokeLinecap="round"></path>
            <path className="fill-secondary/5 stroke-none" d="M0 80 Q 50 70, 100 85 T 200 40 T 300 60 T 400 20 V 100 H 0 Z"></path>
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </section>
    </>
  );
};

export default DashboardOverview;
