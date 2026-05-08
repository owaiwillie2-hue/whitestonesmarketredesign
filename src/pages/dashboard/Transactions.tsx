import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Loader, Eye, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, DollarSign, ArrowDownLeft, ArrowUpRight, Download, CalendarIcon, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  status: string;
}

interface Deposit {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected' | 'processing';
  payment_method: string | null;
  proof_url: string | null;
  created_at: string;
  approved_at: string | null;
  notes: string | null;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected' | 'processing';
  created_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
  account_id: string | null;
}

interface Investment {
  id: string;
  amount: number;
  expected_profit: number;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  plan_id: string;
}

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

const Transactions = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam && ['general', 'deposits', 'withdrawals', 'investments'].includes(tabParam) ? tabParam : 'general');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const [transactionsRes, depositsRes, withdrawalsRes, investmentsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    setTransactions(transactionsRes.data || []);
    setDeposits(depositsRes.data || []);
    setWithdrawals(withdrawalsRes.data || []);
    setInvestments(investmentsRes.data || []);
    setLoading(false);
  };

  const filterByDate = <T extends { created_at: string }>(items: T[]): T[] => {
    if (dateFilter === 'all') return items;

    const now = new Date();
    let start: Date, end: Date;

    switch (dateFilter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        if (!dateRange.from || !dateRange.to) return items;
        start = startOfDay(dateRange.from);
        end = endOfDay(dateRange.to);
        break;
      default:
        return items;
    }

    return items.filter(item =>
      isWithinInterval(new Date(item.created_at), { start, end })
    );
  };

  const filterInvestmentsByDate = (items: Investment[]): Investment[] => {
    if (dateFilter === 'all') return items;

    const now = new Date();
    let start: Date, end: Date;

    switch (dateFilter) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        if (!dateRange.from || !dateRange.to) return items;
        start = startOfDay(dateRange.from);
        end = endOfDay(dateRange.to);
        break;
      default:
        return items;
    }

    return items.filter(item =>
      isWithinInterval(new Date(item.start_date), { start, end })
    );
  };

  const getStatistics = () => {
    const filteredDeposits = filterByDate(deposits.filter(d => d.status === 'completed'));
    const filteredWithdrawals = filterByDate(withdrawals.filter(w => w.status === 'completed'));
    const filteredInvestments = filterInvestmentsByDate(investments);

    const totalDeposited = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);
    const totalWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalInvested = filteredInvestments.reduce((sum, i) => sum + i.amount, 0);
    const totalProfit = filteredInvestments.filter(i => i.status === 'completed').reduce((sum, i) => sum + i.expected_profit, 0);

    // Calculate transaction count from all sources for the selected filter
    const filteredTransactionsList = filterByDate(transactions);
    const filteredDepositsList = filterByDate(deposits);
    const filteredWithdrawalsList = filterByDate(withdrawals);
    const filteredInvestmentsList = filterInvestmentsByDate(investments);
    const transactionCount = filteredTransactionsList.length + filteredDepositsList.length + filteredWithdrawalsList.length + filteredInvestmentsList.length;

    return { totalDeposited, totalWithdrawn, totalInvested, totalProfit, transactionCount };
  };

  const stats = getStatistics();

  const exportToCSV = () => {
    const data = activeTab === 'general' ? combinedTransactions 
      : activeTab === 'deposits' ? filterByDate(deposits)
      : activeTab === 'withdrawals' ? filterByDate(withdrawals)
      : filterInvestmentsByDate(investments);

    let csv = '';
    let headers = '';

    if (activeTab === 'general') {
      headers = 'Date,Type,Amount,Description,Status\n';
      csv = data.map((t: any) => 
        `${format(new Date(t.created_at), 'yyyy-MM-dd HH:mm')},${t.type},$${Math.abs(t.amount)},${t.description || 'N/A'},${t.status}`
      ).join('\n');
    } else if (activeTab === 'deposits') {
      headers = 'Date,Amount,Status,Payment Method,Approved Date\n';
      csv = data.map((d: any) => 
        `${format(new Date(d.created_at), 'yyyy-MM-dd HH:mm')},$${d.amount},${d.status},${d.payment_method || 'N/A'},${d.approved_at ? format(new Date(d.approved_at), 'yyyy-MM-dd') : 'N/A'}`
      ).join('\n');
    } else if (activeTab === 'withdrawals') {
      headers = 'Date,Amount,Status,Approved Date\n';
      csv = data.map((w: any) => 
        `${format(new Date(w.created_at), 'yyyy-MM-dd HH:mm')},$${w.amount},${w.status},${w.approved_at ? format(new Date(w.approved_at), 'yyyy-MM-dd') : 'N/A'}`
      ).join('\n');
    } else {
      headers = 'Start Date,Amount,Expected Profit,Status,End Date\n';
      csv = data.map((i: any) => 
        `${format(new Date(i.start_date), 'yyyy-MM-dd')},$${i.amount},$${i.expected_profit},${i.status},${format(new Date(i.end_date), 'yyyy-MM-dd')}`
      ).join('\n');
    }

    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return (
          <Badge className="bg-success/10 text-success border-success flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            {status === 'completed' ? 'Completed' : 'Active'}
          </Badge>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            {status === 'rejected' ? 'Rejected' : 'Cancelled'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Processing
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const viewProof = async (deposit: Deposit) => {
    if (!deposit.proof_url) return;

    setSelectedDeposit(deposit);
    setLoadingImage(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('deposit-proofs')
        .createSignedUrl(deposit.proof_url, 3600);

      if (error) throw error;
      setProofImageUrl(data.signedUrl);
    } catch (error) {
      console.error('Error loading proof image:', error);
      setProofImageUrl(null);
    } finally {
      setLoadingImage(false);
    }
  };

  const closeModal = () => {
    setSelectedDeposit(null);
    setProofImageUrl(null);
  };



  const filteredTransactions = filterByDate(transactions);
  const filteredDeposits = filterByDate(deposits);
  const filteredWithdrawals = filterByDate(withdrawals);
  const filteredInvestments = filterInvestmentsByDate(investments);

  // Create combined transactions for the General tab
  const combinedTransactions = [
    ...filteredTransactions.map(t => ({
      id: t.id,
      type: t.type === 'referral_bonus' ? 'bonus' : t.type,
      amount: t.amount,
      description: t.type === 'referral_bonus' ? t.description || 'Bonus received' : t.description,
      status: t.status,
      created_at: t.created_at,
      source: 'transaction' as const
    })),
    ...filteredDeposits.map(d => ({
      id: d.id,
      type: 'deposit',
      amount: d.amount,
      description: `Deposit via ${d.payment_method || 'N/A'}`,
      status: d.status,
      created_at: d.created_at,
      source: 'deposit' as const
    })),
    ...filteredWithdrawals.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: -w.amount,
      description: 'Withdrawal request',
      status: w.status,
      created_at: w.created_at,
      source: 'withdrawal' as const
    })),
    ...filteredInvestments.map(i => ({
      id: i.id,
      type: 'investment',
      amount: -i.amount,
      description: `Investment of $${i.amount} (Expected profit: $${i.expected_profit})`,
      status: i.status,
      created_at: i.start_date,
      source: 'investment' as const
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="pt-4 pb-28 max-w-md mx-auto">
      {/* Header & Export Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Transactions</h2>
          <p className="font-label-md text-label-md text-on-surface-variant opacity-70">Review your capital flow</p>
        </div>
        <button onClick={exportToCSV} className="bg-primary text-white p-3 rounded-full shadow-lg active:scale-90 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
          <span className="font-label-md text-sm">CSV</span>
        </button>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <p className="font-label-md text-on-surface-variant mb-1">Total Deposits</p>
          <p className="font-display-lg text-[28px] text-primary">${stats.totalDeposited.toFixed(2)}</p>
          <div className="mt-3 flex items-center text-on-tertiary-container gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span className="text-xs font-semibold">{stats.transactionCount} transactions found</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="font-label-md text-on-surface-variant mb-1">Profit</p>
          <p className="font-headline-md text-on-tertiary-container">${stats.totalProfit.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="font-label-md text-on-surface-variant mb-1">Invested</p>
          <p className="font-headline-md text-primary">${stats.totalInvested.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters & Navigation */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setDateFilter('all')} className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap ${dateFilter === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>All Time</button>
          <button onClick={() => setDateFilter('month')} className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap ${dateFilter === 'month' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>This Month</button>
          <button onClick={() => setDateFilter('today')} className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap ${dateFilter === 'today' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>Today</button>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className={`px-4 py-2 rounded-full font-label-md whitespace-nowrap flex items-center gap-1 ${dateFilter === 'custom' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Custom Range
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  if(range?.from && range?.to) setDateFilter('custom');
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab('general')} className={`flex-1 pb-3 font-label-md ${activeTab === 'general' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}>All</button>
          <button onClick={() => setActiveTab('deposits')} className={`flex-1 pb-3 font-label-md ${activeTab === 'deposits' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}>Deposits</button>
          <button onClick={() => setActiveTab('withdrawals')} className={`flex-1 pb-3 font-label-md ${activeTab === 'withdrawals' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}>Withdrawals</button>
          <button onClick={() => setActiveTab('investments')} className={`flex-1 pb-3 font-label-md ${activeTab === 'investments' ? 'text-secondary border-b-2 border-secondary font-semibold' : 'text-on-surface-variant'}`}>Investments</button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {activeTab === 'general' && combinedTransactions.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline/50 mb-3">receipt_long</span>
            <p className="text-on-surface-variant">No transactions found</p>
          </div>
        )}

        {activeTab === 'general' && combinedTransactions.map((tx) => (
          <div key={`${tx.source}-${tx.id}`} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              tx.type === 'deposit' ? 'bg-blue-50 text-blue-600' :
              tx.type === 'withdrawal' ? 'bg-error-container/20 text-error' :
              'bg-slate-50 text-slate-600'
            }`}>
              <span className="material-symbols-outlined">
                {tx.type === 'deposit' ? 'south_west' : 
                 tx.type === 'withdrawal' ? 'north_east' : 
                 'trending_up'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-headline-md text-[16px] text-on-surface capitalize truncate pr-2">{tx.type}</h4>
                <span className={`font-data-mono whitespace-nowrap ${
                  tx.amount > 0 || tx.type === 'deposit' ? 'text-on-tertiary-container' : 
                  tx.type === 'withdrawal' ? 'text-error' : 'text-primary'
                }`}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="font-label-md text-on-surface-variant text-xs opacity-60 truncate">
                  {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                </p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-2 ${
                  tx.status === 'completed' || tx.status === 'active' ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant' :
                  tx.status === 'pending' || tx.status === 'processing' ? 'bg-warning/10 text-warning' :
                  'bg-error-container text-on-error-container'
                }`}>
                  {tx.status}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 truncate">{tx.description}</p>
            </div>
          </div>
        ))}

        {activeTab === 'deposits' && filteredDeposits.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline/50 mb-3">account_balance_wallet</span>
            <p className="text-on-surface-variant">No deposits found</p>
          </div>
        )}
        
        {activeTab === 'deposits' && filteredDeposits.map((tx) => (
          <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">south_west</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-headline-md text-[16px] text-on-surface">Deposit</h4>
                <span className="font-data-mono text-on-tertiary-container">+${tx.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="font-label-md text-on-surface-variant text-xs opacity-60">
                  {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                </p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  tx.status === 'completed' ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant' :
                  tx.status === 'pending' || tx.status === 'processing' ? 'bg-warning/10 text-warning' :
                  'bg-error-container text-on-error-container'
                }`}>
                  {tx.status}
                </span>
              </div>
              {tx.proof_url && (
                <button onClick={() => viewProof(tx)} className="mt-2 inline-flex items-center gap-1 text-secondary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                  View Payment Proof
                </button>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'withdrawals' && filteredWithdrawals.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline/50 mb-3">account_balance</span>
            <p className="text-on-surface-variant">No withdrawals found</p>
          </div>
        )}

        {activeTab === 'withdrawals' && filteredWithdrawals.map((tx) => (
          <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-xl bg-error-container/20 flex items-center justify-center text-error">
              <span className="material-symbols-outlined">north_east</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-headline-md text-[16px] text-on-surface">Withdrawal</h4>
                <span className="font-data-mono text-error">-${tx.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="font-label-md text-on-surface-variant text-xs opacity-60">
                  {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                </p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  tx.status === 'completed' ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant' :
                  tx.status === 'pending' || tx.status === 'processing' ? 'bg-warning/10 text-warning' :
                  'bg-error-container text-on-error-container'
                }`}>
                  {tx.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'investments' && filteredInvestments.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline/50 mb-3">trending_up</span>
            <p className="text-on-surface-variant">No investments found</p>
          </div>
        )}

        {activeTab === 'investments' && filteredInvestments.map((tx) => (
          <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-headline-md text-[16px] text-on-surface">Investment</h4>
                <span className="font-data-mono text-primary">-${tx.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="font-label-md text-on-surface-variant text-xs opacity-60">
                  {format(new Date(tx.start_date), 'MMM dd, yyyy')}
                </p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  tx.status === 'completed' ? 'bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant' :
                  tx.status === 'active' ? 'bg-blue-50 text-blue-600' :
                  'bg-error-container text-on-error-container'
                }`}>
                  {tx.status}
                </span>
              </div>
              <p className="text-xs text-success font-semibold mt-1">Expected Profit: ${tx.expected_profit.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Proof Image Modal */}
      <Dialog open={!!selectedDeposit} onOpenChange={closeModal}>
        <DialogContent className="max-w-3xl bg-surface border-slate-200 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-on-surface-variant text-xs font-label-md uppercase tracking-widest">Amount</p>
                  <p className="font-display-lg text-primary text-xl">
                    ${selectedDeposit.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-xs font-label-md uppercase tracking-widest">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-surface-container-lowest">
                {loadingImage ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : proofImageUrl ? (
                  <img
                    src={proofImageUrl}
                    alt="Payment Proof"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-on-surface-variant">
                    <p>Unable to load image</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
