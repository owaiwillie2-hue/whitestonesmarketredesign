import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react';

const Invest = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const upgradeMode = searchParams.get('upgrade') === 'true';
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [investmentBalance, setInvestmentBalance] = useState(0);
  const [currentActivePlan, setCurrentActivePlan] = useState<any>(null);
  const [totalDeposited, setTotalDeposited] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!planId || !user) return;
      setLoading(true);
      try {
        const promises: Promise<any>[] = [
          supabase.from('investment_plans').select('*').eq('id', planId).single(),
          supabase.from('account_balances').select('investment_balance').eq('user_id', user.id).maybeSingle(),
          supabase.from('deposits').select('amount').eq('user_id', user.id).eq('status', 'completed')
        ];

        if (upgradeMode) {
          promises.push(
            supabase.from('investments').select('*, investment_plans(*)').eq('user_id', user.id)
          );
        }

        const results = await Promise.all(promises);

        const planRes = results[0];
        if (planRes.error) throw planRes.error;
        const planData = planRes.data;
        setPlan(planData);
        if (planData) {
          setAmount(planData.min_amount.toString());
        }

        const balanceData = results[1].data;
        if (balanceData) {
          setInvestmentBalance(balanceData.investment_balance || 0);
        }

        const depositsData = results[2].data || [];
        const totalDep = depositsData.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
        setTotalDeposited(totalDep);

        if (upgradeMode && results[3]) {
          const allInvestments = results[3].data || [];
          if (allInvestments.length > 0) {
            const highestTierInvestment = allInvestments.sort((a: any, b: any) => {
              const planA = a.investment_plans;
              const planB = b.investment_plans;
              return (planB?.min_amount || 0) - (planA?.min_amount || 0);
            })[0];
            setCurrentActivePlan(highestTierInvestment);
          }
        }
      } catch (error) {
        console.error('Error loading invest page data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load investment plan details',
          variant: 'destructive',
        });
        navigate('/dashboard/plans');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId, upgradeMode, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const investAmount = parseFloat(amount);
    if (totalDeposited < plan.min_amount) {
      toast({
        title: 'Plan Locked',
        description: `This plan requires a minimum cumulative deposit of $${plan.min_amount}. Your cumulative deposits are $${totalDeposited}.`,
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(investAmount) || investAmount < plan.min_amount) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum investment is $${plan.min_amount}`,
        variant: 'destructive',
      });
      return;
    }

    if (plan.max_amount && investAmount > plan.max_amount) {
      toast({
        title: 'Invalid Amount',
        description: `Maximum investment is $${plan.max_amount}`,
        variant: 'destructive',
      });
      return;
    }

    if (investAmount > investmentBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough funds in your investment wallet',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      if (!user) throw new Error('Not authenticated');

      const durationInDays = Number(plan.duration_days);
      const startDate = new Date();
      const endDate = new Date();
      
      if (durationInDays < 1) {
        endDate.setHours(endDate.getHours() + (durationInDays * 24));
      } else {
        endDate.setDate(endDate.getDate() + durationInDays);
      }

      const expectedProfit = investAmount * (plan.profit_percentage / 100);

      // If in upgrade mode and there's an active plan, cancel it first
      if (upgradeMode && currentActivePlan) {
        // Only cancel if it's currently active
        if (currentActivePlan.status === 'active') {
          const { error: cancelError } = await supabase
            .from('investments')
            .update({ status: 'cancelled' })
            .eq('id', currentActivePlan.id);

          if (cancelError) throw cancelError;
        }
      }

      const { error: investError } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          amount: investAmount,
          expected_profit: expectedProfit,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
        });

      if (investError) throw investError;

      const { error: balanceError } = await supabase
        .from('account_balances')
        .update({
          investment_balance: investmentBalance - investAmount,
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'investment',
        amount: -investAmount,
        description: `Investment in ${plan.name}`,
        status: 'completed',
      });

      toast({
        title: 'Success',
        description: upgradeMode 
          ? `Successfully upgraded to ${plan.name}!` 
          : `Investment of $${investAmount} created successfully!`,
      });

      navigate('/dashboard/investments');
    } catch (error) {
      console.error('Error creating investment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create investment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Plan not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(upgradeMode ? '/dashboard' : '/dashboard/plans')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-variant active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {upgradeMode ? 'Upgrade Plan' : 'Create Investment'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {upgradeMode 
              ? 'Upgrade to a higher tier plan' 
              : 'Review details and confirm'}
          </p>
        </div>
      </div>

      {upgradeMode && currentActivePlan && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
          <p className="text-sm text-blue-800 leading-relaxed">
            You are upgrading from <strong>{currentActivePlan.investment_plans.name}</strong>. 
            {currentActivePlan.status === 'active' && ' Your current active investment will be cancelled.'}
          </p>
        </div>
      )}

      {/* Plan Summary Card */}
      <div className="glass-card border border-outline-variant rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="bg-secondary-container text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {plan.name}
              </span>
              <p className="text-sm text-on-surface-variant mt-2">{plan.description}</p>
            </div>
            <span className="material-symbols-outlined text-secondary-container text-3xl">stars</span>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600">trending_up</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-label-md uppercase">ROI</p>
                <p className="font-data-mono text-green-600 font-bold">{plan.profit_percentage}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-600">schedule</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-label-md uppercase">Duration</p>
                <p className="font-data-mono text-primary font-bold">
                  {plan.duration_days < 1 ? `${plan.duration_days * 24}h` : `${plan.duration_days}d`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Form */}
      <div className="glass-card border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/50">
          <span className="font-label-md text-on-surface-variant text-sm">Available Balance</span>
          <span className="font-headline-md text-green-600">${investmentBalance.toFixed(2)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant ml-1">Investment Amount (USD)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="font-headline-md text-on-surface-variant group-focus-within:text-secondary-container transition-colors">$</span>
              </div>
              <input 
                type="number"
                step="0.01"
                min={plan.min_amount}
                max={plan.max_amount || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-white border-2 border-outline-variant rounded-2xl py-4 pl-10 pr-4 font-headline-md focus:border-secondary-container focus:ring-0 transition-all placeholder:text-outline-variant" 
                placeholder={`Min: ${plan.min_amount}`}
              />
            </div>
            <p className="text-xs text-on-surface-variant ml-1">
              Limits: ${plan.min_amount} - {plan.max_amount ? `$${plan.max_amount}` : 'Unlimited'}
            </p>
          </div>

          {amount && !isNaN(parseFloat(amount)) && (
            <div className="bg-green-50/50 border border-green-200 rounded-xl p-4 space-y-2 animate-fade-in">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Investment:</span>
                <span className="font-data-mono">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Expected Profit:</span>
                <span className="font-data-mono text-green-600">+${(parseFloat(amount) * (plan.profit_percentage / 100)).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-green-200/50 flex justify-between items-center">
                <span className="font-label-md text-primary">Total Return:</span>
                <span className="font-headline-md text-green-600">${(parseFloat(amount) + (parseFloat(amount) * (plan.profit_percentage / 100))).toFixed(2)}</span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitting || !amount || parseFloat(amount) < plan.min_amount || parseFloat(amount) > investmentBalance}
            className="w-full bg-primary text-white py-4 rounded-full font-headline-md shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {submitting ? (
              <><span className="material-symbols-outlined animate-spin">progress_activity</span> Processing...</>
            ) : upgradeMode ? (
              'Confirm Upgrade'
            ) : (
              'Confirm Investment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Invest;
