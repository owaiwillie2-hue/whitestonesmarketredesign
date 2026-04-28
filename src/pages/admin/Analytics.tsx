import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { TrendingUp, Users, DollarSign, Activity as ActivityIcon } from 'lucide-react';
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
    depositChange: 0,
    withdrawalChange: 0,
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
        depositChange: 0,
        withdrawalChange: 0,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track key metrics and performance in real-time</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalDeposits.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Last {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalWithdrawals.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  Last {timeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeInvestments}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <AnalyticsCharts
            depositsOverTime={depositsOverTime}
            withdrawalsOverTime={withdrawalsOverTime}
            investmentsByPlan={investmentsByPlan}
            userGrowth={userGrowth}
            kycCompletion={kycCompletion}
          />
        </div>
      )}
    </div>
  );
};

export default Analytics;
