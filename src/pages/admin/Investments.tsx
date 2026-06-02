import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

export const AdminInvestments = () => {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<any[]>([]);
  const [filteredInvestments, setFilteredInvestments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      // 1. Fetch investments
      const { data: investmentsData, error: invError } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      const userIds = (investmentsData || []).map((i: any) => i.user_id);
      const planIds = (investmentsData || []).map((i: any) => i.plan_id);

      // 2. Fetch profiles & plans in parallel
      const [{ data: profiles }, { data: plans }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, full_name, email')
          .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
          .from('investment_plans')
          .select('id, name, duration_days, profit_percentage')
          .in('id', planIds.length ? planIds : ['00000000-0000-0000-0000-000000000000']),
      ]);

      const profilesByUser: Record<string, any> = {};
      (profiles || []).forEach((p: any) => {
        profilesByUser[p.user_id] = p;
      });

      const plansById: Record<string, any> = {};
      (plans || []).forEach((pl: any) => {
        plansById[pl.id] = pl;
      });

      const enriched = (investmentsData || []).map((inv: any) => ({
        ...inv,
        profiles: profilesByUser[inv.user_id],
        investment_plans: plansById[inv.plan_id],
      }));

      setInvestments(enriched);
      applyFilters(enriched, searchQuery, activeTab);
    } catch (error: any) {
      console.error('Error fetching investments:', error);
      toast.error('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (
    list: any[],
    query: string,
    tab: 'all' | 'active' | 'completed' | 'cancelled'
  ) => {
    let result = [...list];

    if (tab !== 'all') {
      result = result.filter((item) => item.status === tab);
    }

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (item) =>
          item.profiles?.full_name?.toLowerCase().includes(q) ||
          item.profiles?.email?.toLowerCase().includes(q) ||
          item.investment_plans?.name?.toLowerCase().includes(q)
      );
    }

    setFilteredInvestments(result);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    applyFilters(investments, val, activeTab);
  };

  const handleTabChange = (tab: 'all' | 'active' | 'completed' | 'cancelled') => {
    setActiveTab(tab);
    applyFilters(investments, searchQuery, tab);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      const { id, user_id, amount, expected_profit, profit, investment_plans, status } = cancelTarget;
      const planName = investment_plans?.name || 'Investment Plan';
      const principalVal = Number(amount || 0);
      const profitVal = Number(expected_profit || profit || 0);

      // 1. Update investment status to 'cancelled'
      const { error: cancelError } = await supabase
        .from('investments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (cancelError) throw cancelError;

      // 2. Fetch user's current account balances
      const { data: balanceData, error: fetchBalError } = await supabase
        .from('account_balances')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (fetchBalError) throw fetchBalError;

      const currentMain = Number(balanceData?.main_balance || 0);
      const currentInvestment = Number(balanceData?.investment_balance || 0);
      const currentProfit = Number(balanceData?.profit_balance || 0);

      let updatePayload: any = {};
      let refundDescription = '';

      if (status === 'completed') {
        // Refund principal to main_balance, subtract profit from profit_balance
        updatePayload = {
          main_balance: currentMain + principalVal,
          profit_balance: Math.max(0, currentProfit - profitVal)
        };
        refundDescription = `System Correction Refund: completed plan ${planName} reversed (Principal returned, profit adjusted)`;
      } else {
        // Refund principal to investment_balance
        updatePayload = {
          investment_balance: currentInvestment + principalVal
        };
        refundDescription = `Refund for cancelled active investment plan - ${planName}`;
      }

      // 3. Update account balances
      const { error: updateBalError } = await supabase
        .from('account_balances')
        .update(updatePayload)
        .eq('user_id', user_id);

      if (updateBalError) throw updateBalError;

      // 4. Log refund transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user_id,
          type: 'investment',
          amount: principalVal,
          description: refundDescription,
          status: 'completed',
        });

      if (txError) throw txError;

      // 5. Send targeted notification to user
      const glitchMessage = `Technical Reconciliation Notice: We have identified a system discrepancy that permitted enrolment in the ${planName} for which eligibility requirements were not met. As a result, this investment has been cancelled. Your principal investment of $${principalVal.toFixed(2)} has been refunded to your wallet, and associated yields have been adjusted accordingly. We sincerely apologize for this inconvenience.`;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          title: 'Account Reconciliation Alert',
          message: glitchMessage,
          type: 'investment_updates',
          is_global: false,
        });

      if (notifError) throw notifError;

      toast.success(
        status === 'completed'
          ? `Completed investment reconciled. Principal ($${principalVal.toFixed(2)}) returned to Main Wallet. Notification sent.`
          : `Active investment cancelled. Principal ($${principalVal.toFixed(2)}) returned to Investment Wallet. Notification sent.`
      );
      setCancelTarget(null);
      fetchInvestments();
    } catch (error: any) {
      console.error('Error cancelling/reconciling investment:', error);
      toast.error(error.message || 'Failed to complete reconciliation');
    } finally {
      setCancelling(false);
    }
  };

  // Metrics calculations
  const activeCount = investments.filter((i) => i.status === 'active').length;
  const totalInvested = investments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpectedProfit = investments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + Number(i.expected_profit || 0), 0);

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Active Investments</h1>
        <p className="text-xs text-slate-500 mt-1">Monitor all user investment portfolios and cancel active plans if necessary</p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Portfolios</CardTitle>
            <span className="material-symbols-outlined text-primary text-[20px] bg-primary/10 p-1.5 rounded-xl">trending_up</span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeCount}</div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Currently running plans</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active Invested</CardTitle>
            <span className="material-symbols-outlined text-green-500 text-[20px] bg-green-500/10 p-1.5 rounded-xl">payments</span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Active capital on platform</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Profit Yields</CardTitle>
            <span className="material-symbols-outlined text-amber-500 text-[20px] bg-amber-500/10 p-1.5 rounded-xl">award</span>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${totalExpectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Projected total payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main List Card */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 self-start border border-slate-200/50 dark:border-slate-700/50">
              {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
                <Button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  variant="ghost"
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${
                    activeTab === tab
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <Input
                placeholder="Search user, email, plan..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No investments found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Plan</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Amount</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Expected Profit</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Start / End</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvestments.map((inv) => (
                    <TableRow key={inv.id} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell 
                        className="px-6 py-4 cursor-pointer hover:underline"
                        onClick={() => {
                          if (inv.profiles?.id) {
                            navigate(`/admin/users/${inv.profiles.id}`);
                          }
                        }}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{inv.profiles?.full_name || 'Unnamed'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{inv.profiles?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{inv.investment_plans?.name || 'Investment Plan'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{inv.investment_plans?.profit_percentage}% ROI | {inv.investment_plans?.duration_days} Days</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">
                        ${parseFloat(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-6 py-4">
                        +${parseFloat(inv.expected_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[10px] text-slate-500 leading-relaxed">
                        <div>S: {format(new Date(inv.start_date), 'yyyy-MM-dd HH:mm')}</div>
                        <div>E: {format(new Date(inv.end_date), 'yyyy-MM-dd HH:mm')}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold border-none capitalize ${
                            inv.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : inv.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {(inv.status === 'active' || inv.status === 'completed') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => setCancelTarget(inv)}
                          >
                            {inv.status === 'active' ? 'Cancel Plan' : 'Reconcile'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Dialog Confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 gap-0 font-['Plus_Jakarta_Sans']">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
              {cancelTarget?.status === 'completed' ? 'Reconcile Completed Investment?' : 'Cancel Active Investment?'}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-500 mt-1">
              {cancelTarget?.status === 'completed'
                ? 'This will reverse the completed investment, refunding the principal to the user\'s Main Wallet and deducting profit yields.'
                : 'Confirming this will abort the user\'s active investment yield and refund their principal.'}
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="py-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cancelTarget.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cancelTarget.profiles?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan Tier:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cancelTarget.investment_plans?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Principal Investment:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">${Number(cancelTarget.amount).toFixed(2)}</span>
                </div>
                {cancelTarget.status === 'completed' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accrued Profit Yield:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">${Number(cancelTarget.expected_profit || cancelTarget.profit || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">warning</span>
                {cancelTarget.status === 'completed' ? (
                  <span>
                    The principal capital of <strong>${Number(cancelTarget.amount).toFixed(2)}</strong> will be refunded to their <strong>Main Wallet</strong>, and the profit payout of <strong>${Number(cancelTarget.expected_profit || cancelTarget.profit || 0).toFixed(2)}</strong> will be subtracted from their <strong>Profit Wallet</strong>. A glitch adjustment notification will be sent.
                  </span>
                ) : (
                  <span>
                    The principal capital of <strong>${Number(cancelTarget.amount).toFixed(2)}</strong> will be instantly refunded to the user's <strong>Investment Wallet</strong>, and no yield/profit will be paid out. A correction notification will be sent.
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 font-['Plus_Jakarta_Sans']">
            <Button
              variant="outline"
              disabled={cancelling}
              onClick={() => setCancelTarget(null)}
              className="h-10 text-xs font-bold rounded-xl"
            >
              Go Back
            </Button>
            <Button
              disabled={cancelling}
              onClick={handleCancelConfirm}
              className="h-10 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelling ? 'Processing Reconcile...' : 'Confirm Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvestments;
