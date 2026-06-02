import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [depositsOverTime, setDepositsOverTime] = useState<any[]>([]);
  const [withdrawalsOverTime, setWithdrawalsOverTime] = useState<any[]>([]);
  const [investmentsByPlan, setInvestmentsByPlan] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [kycCompletion, setKycCompletion] = useState({ completed: 0, pending: 0, rejected: 0 });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeInvestments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDaysInRange = () => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysBack = getDaysInRange();
      const startDate = startOfDay(subDays(new Date(), daysBack));
      const startDateISO = startDate.toISOString();

      // Fetch deposits over time
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount, status, created_at')
        .gte('created_at', startDateISO)
        .eq('status', 'completed');

      // Fetch withdrawals over time
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status, created_at')
        .gte('created_at', startDateISO)
        .eq('status', 'completed');

      // Fetch investments by plan
      const { data: investments } = await supabase
        .from('investments')
        .select(`
          amount,
          status,
          investment_plans(name, profit_percentage)
        `)
        .gte('created_at', startDateISO);

      // Fetch KYC completion
      const { data: kycData } = await supabase
        .from('kyc_documents')
        .select('status, submitted_at')
        .gte('submitted_at', startDateISO);

      // Process deposits over time (daily)
      const depositsDaily: { [key: string]: number } = {};
      deposits?.forEach((d: any) => {
        const date = format(new Date(d.created_at), 'MMM dd');
        depositsDaily[date] = (depositsDaily[date] || 0) + Number(d.amount || 0);
      });

      setDepositsOverTime(
        Object.entries(depositsDaily).map(([date, amount]) => ({
          date,
          amount,
        }))
      );

      // Process withdrawals over time (daily)
      const withdrawalsDaily: { [key: string]: number } = {};
      withdrawals?.forEach((w: any) => {
        const date = format(new Date(w.created_at), 'MMM dd');
        withdrawalsDaily[date] = (withdrawalsDaily[date] || 0) + Number(w.amount || 0);
      });

      setWithdrawalsOverTime(
        Object.entries(withdrawalsDaily).map(([date, amount]) => ({
          date,
          amount,
        }))
      );

      // Process investments by plan
      const investmentsByPlanMap: { [key: string]: { count: number; total: number; roi: number } } = {};
      investments?.forEach((i: any) => {
        const planName = i.investment_plans?.name || 'Unknown';
        const roi = i.investment_plans?.profit_percentage || 0;
        if (!investmentsByPlanMap[planName]) {
          investmentsByPlanMap[planName] = { count: 0, total: 0, roi };
        }
        investmentsByPlanMap[planName].count += 1;
        investmentsByPlanMap[planName].total += Number(i.amount || 0);
      });

      setInvestmentsByPlan(
        Object.entries(investmentsByPlanMap).map(([plan, data]) => ({
          plan,
          ...data,
        }))
      );

      // Process KYC completion
      const kycStats = {
        completed: kycData?.filter((k: any) => k.status === 'approved').length || 0,
        pending: kycData?.filter((k: any) => k.status === 'pending' || k.status === 'under_review').length || 0,
        rejected: kycData?.filter((k: any) => k.status === 'rejected').length || 0,
      };

      setKycCompletion(kycStats);

      // Fetch user growth
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDateISO)
        .order('created_at', { ascending: true });

      const userGrowthDaily: { [key: string]: number } = {};
      let cumulativeCount = 0;
      users?.forEach((u: any) => {
        const date = format(new Date(u.created_at), 'MMM dd');
        cumulativeCount++;
        userGrowthDaily[date] = cumulativeCount;
      });

      setUserGrowth(
        Object.entries(userGrowthDaily).map(([date, count]) => ({
          date,
          count,
        }))
      );

      // Calculate overall stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const totalDepositsAmount = deposits?.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0) || 0;
      const totalWithdrawalsAmount = withdrawals?.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0) || 0;

      const { count: activeInvestmentsCount } = await supabase
        .from('investments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalUsers: totalUsers || 0,
        totalDeposits: totalDepositsAmount,
        totalWithdrawals: totalWithdrawalsAmount,
        activeInvestments: activeInvestmentsCount || 0,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Track platform operations, financial stats, and user growth</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200/50 dark:border-slate-700/50">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant="ghost"
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                timeRange === range 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</CardTitle>
              <span className="material-symbols-outlined text-primary text-[20px] bg-primary/10 p-1.5 rounded-xl">group</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-slate-205 dark:bg-slate-800 rounded animate-pulse mt-1" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Total registered profiles</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Deposits</CardTitle>
              <span className="material-symbols-outlined text-green-500 text-[20px] bg-green-500/10 p-1.5 rounded-xl">payments</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-28 bg-slate-205 dark:bg-slate-800 rounded animate-pulse mt-1" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Approved deposits in interval</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Withdrawals</CardTitle>
              <span className="material-symbols-outlined text-red-500 text-[20px] bg-red-500/10 p-1.5 rounded-xl">price_change</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-28 bg-slate-205 dark:bg-slate-800 rounded animate-pulse mt-1" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Completed cashouts in interval</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Investments</CardTitle>
              <span className="material-symbols-outlined text-blue-500 text-[20px] bg-blue-500/10 p-1.5 rounded-xl">trending_up</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-16 bg-slate-205 dark:bg-slate-800 rounded animate-pulse mt-1" />
              ) : (
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.activeInvestments}</div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Currently generating returns</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl h-[360px] bg-white dark:bg-slate-900 animate-pulse" />
            <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl h-[360px] bg-white dark:bg-slate-900 animate-pulse" />
          </div>
        ) : (
          <AnalyticsCharts
            depositsOverTime={depositsOverTime}
            withdrawalsOverTime={withdrawalsOverTime}
            investmentsByPlan={investmentsByPlan}
            userGrowth={userGrowth}
            kycCompletion={kycCompletion}
          />
        )}
      </div>
    </div>
  );
};

export default Analytics;

