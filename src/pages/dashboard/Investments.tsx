import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { KYCGuard } from '@/components/KYCGuard';
import { useInvestmentTimer, formatTimerDisplay } from '@/hooks/useInvestmentTimer';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

const Investments = () => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isApproved: kycApproved, isPending: kycPending, initialLoading: kycLoading } = useKYCStatus();

  useEffect(() => {
    fetchInvestments();

    // Set up real-time subscription for new investments
    const channel = supabase
      .channel('investments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        () => {
          fetchInvestments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('investments')
        .select(`
          *,
          investment_plans(name, profit_percentage, duration_days)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleClaimProfit = async (investmentId: string) => {
    setCompletingId(investmentId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('investment-completion', {
        body: {
          investmentId,
          userId: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to complete investment');
      }

      const { principal_returned, profit_returned, total_returned } = response.data;

      toast({
        title: 'Profit Claimed!',
        description: `Principal: $${principal_returned}, Profit: $${profit_returned}, Total: $${total_returned} returned to Main Wallet`,
      });

      // Refresh investments list
      await fetchInvestments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to claim profit',
        variant: 'destructive',
      });
    } finally {
      setCompletingId(null);
    }
  };

  const InvestmentCard = ({ investment }: { investment: any }) => {
    const timer = useInvestmentTimer(investment.id, investment.end_date);
    const isExpired = timer.isExpired;
    const canClaim = investment.status === 'active' && isExpired && kycApproved;
    const isRunning = investment.status === 'active' && !isExpired;
    
    // Calculate progress percentage if running
    let progressStr = "0%";
    let progressVal = 0;
    if (isRunning) {
      const start = new Date(investment.start_date).getTime();
      const end = new Date(investment.end_date).getTime();
      const now = new Date().getTime();
      if (end > start) {
        progressVal = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        progressStr = `${progressVal.toFixed(0)}%`;
      }
    }

    const durationDays = investment.investment_plans?.duration_days;
    const durationText = durationDays < 1 ? `${durationDays * 24} hours` : `${durationDays} Days`;

    return (
      <div className={`glass-card border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden ${investment.status === 'completed' ? 'opacity-70' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined ${canClaim ? 'text-blue-500' : isRunning ? 'text-purple-500' : 'text-slate-500'}`}>
                {canClaim ? 'account_balance_wallet' : isRunning ? 'trending_up' : 'task_alt'}
              </span>
              <h3 className="font-headline-md text-base text-primary">{investment.investment_plans?.name || 'Investment Plan'}</h3>
            </div>
            <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest">
              Started: {format(new Date(investment.start_date), 'MMM dd, yyyy')}
            </p>
          </div>
          
          {canClaim && (
            <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed-dim/20 text-on-tertiary-container font-label-md text-[10px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              Claim Available
            </span>
          )}
          {isRunning && (
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-label-md text-[10px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">update</span>
              Running
            </span>
          )}
          {investment.status === 'completed' && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-label-md text-[10px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">done_all</span>
              Completed
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-4 mb-5">
          <div>
            <p className="text-[11px] text-on-surface-variant font-label-md uppercase mb-1">Invested</p>
            <p className="font-data-mono text-primary">${investment.amount}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-on-surface-variant font-label-md uppercase mb-1">Profit</p>
            <p className="font-data-mono text-tertiary-fixed-dim">+${investment.expected_profit}</p>
          </div>
          <div>
            <p className="text-[11px] text-on-surface-variant font-label-md uppercase mb-1">ROI %</p>
            <p className="font-data-mono text-primary">{investment.investment_plans?.profit_percentage}%</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-on-surface-variant font-label-md uppercase mb-1">Duration</p>
            <p className="font-data-mono text-primary">{durationText}</p>
          </div>
        </div>

        {isRunning && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-label-md">Progress: {progressStr}</span>
              <span className="text-[10px] text-on-surface-variant font-label-md">{formatTimerDisplay(timer)} Left</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: progressStr }}></div>
            </div>
            <div className="mt-4">
              <button disabled className="w-full bg-slate-100 text-slate-400 font-headline-md text-sm py-3.5 rounded-full cursor-not-allowed">
                Claim Profit (Locked)
              </button>
            </div>
          </div>
        )}

        {canClaim && (
          <>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase font-label-md">Status</span>
                <span className="text-xs text-primary font-medium">Matured</span>
              </div>
              <div className="w-1/2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container w-full"></div>
              </div>
            </div>
            <KYCGuard isApproved={kycApproved} isPending={kycPending} isRejected={false} actionName="claim profits" isLoading={kycLoading} compactSkeleton showAlert={false}>
              <button 
                onClick={() => handleClaimProfit(investment.id)}
                disabled={completingId === investment.id || !kycApproved}
                className="w-full bg-primary text-white font-headline-md text-sm py-3.5 rounded-xl active:scale-[0.98] transition-all duration-200 shadow-md shadow-blue-200 disabled:opacity-70"
              >
                {completingId === investment.id ? 'Claiming...' : 'Claim Profit'}
              </button>
            </KYCGuard>
          </>
        )}
        
        {investment.status === 'completed' && (
          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 mt-2">
            <p className="text-xs text-slate-500 leading-relaxed text-center">
              Successfully claimed on {format(new Date(investment.completed_at || investment.updated_at), 'MMM dd, yyyy')}
            </p>
          </div>
        )}
      </div>
    );
  };



  // Calculate total active invested and total expected profit
  const totalActiveInvested = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  
  const totalExpectedProfit = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + Number(inv.expected_profit), 0);

  const filteredInvestments = investments.filter(inv => inv.status === activeTab);

  return (
    <>
      {/* Header Section */}
      <section className="mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-primary text-2xl font-bold">Investments</h2>
        </div>

        {/* Summary Bento Grid-ish Header */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-primary rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-3xl -mr-12 -mt-12 rounded-full"></div>
            <p className="font-label-md opacity-80 text-[10px] uppercase tracking-wider mb-1">Active Invested</p>
            <div className="flex items-end gap-2">
              <span className="font-headline-md text-3xl">${totalActiveInvested.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-3 opacity-5">
              <span className="material-symbols-outlined text-5xl">trending_up</span>
            </div>
            <p className="font-label-md text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">Expected Returns</p>
            <div className="flex items-end gap-2">
              <span className="font-headline-md text-3xl text-primary dark:text-white">+${totalExpectedProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 mb-2">
        <div className="bg-surface-container-low p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-lg font-label-md text-sm transition-all duration-200 ${activeTab === 'active' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
          >
            Active Investments
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-lg font-label-md text-sm transition-all duration-200 ${activeTab === 'completed' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Investment Cards List */}
      <div className="flex flex-col gap-4">
        {filteredInvestments.length === 0 ? (
          <div className="glass-card border border-slate-200 rounded-2xl p-8 text-center mt-4">
            <p className="text-on-surface-variant font-label-md">No {activeTab} investments found.</p>
            {activeTab === 'active' && (
              <button 
                onClick={() => window.location.href = '/dashboard/plans'}
                className="mt-4 bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all"
              >
                View Plans
              </button>
            )}
          </div>
        ) : (
          filteredInvestments.map((investment) => (
            <InvestmentCard key={investment.id} investment={investment} />
          ))
        )}
      </div>
    </>
  );
};

export default Investments;
