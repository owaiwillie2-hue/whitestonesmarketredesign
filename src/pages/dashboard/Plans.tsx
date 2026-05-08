import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { KYCGuard, KYCStatusBadge } from '@/components/KYCGuard';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const Plans = () => {
  const [searchParams] = useSearchParams();
  const upgradeMode = searchParams.get('upgrade') === 'true';
  const [plans, setPlans] = useState<any[]>([]);
  const [investmentBalance, setInvestmentBalance] = useState<number>(0);
  const [currentActivePlan, setCurrentActivePlan] = useState<any>(null);
  const { isApproved: kycApproved, isPending: kycPending, initialLoading: kycLoading } = useKYCStatus();

  useEffect(() => {
    fetchPlans();
    fetchBalance();
    if (upgradeMode) {
      fetchCurrentActivePlan();
    }
  }, [upgradeMode]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('is_active', true)
      .order('min_amount');

    setPlans(data || []);
  };

  const fetchBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('account_balances')
        .select('investment_balance')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setInvestmentBalance(data.investment_balance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchCurrentActivePlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all investments (including completed ones) to find highest tier ever invested
      const { data: allInvestments } = await supabase
        .from('investments')
        .select('*, investment_plans(*)')
        .eq('user_id', user.id);

      if (allInvestments && allInvestments.length > 0) {
        // Find the highest tier plan ever invested in (by min_amount)
        const highestTierInvestment = allInvestments.sort((a, b) => {
          const planA = (a as any).investment_plans;
          const planB = (b as any).investment_plans;
          return (planB?.min_amount || 0) - (planA?.min_amount || 0);
        })[0];
        
        setCurrentActivePlan(highestTierInvestment);
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const isPlanDisabled = (plan: any) => {
    if (upgradeMode && currentActivePlan) {
      return plan.min_amount < currentActivePlan.investment_plans.min_amount;
    }
    return false;
  };

  const getPlanStyles = (planName: string, isCurrentOrEligible: boolean, isDisabled: boolean) => {
    if (planName.toLowerCase().includes('platinum')) {
      return {
        cardClass: "bg-white border-2 border-secondary-container rounded-2xl p-5 space-y-4 shadow-lg ring-4 ring-secondary-container/5 relative overflow-hidden",
        tagClass: "bg-secondary-container text-white",
        textClass: "text-primary",
        iconClass: "text-secondary-container",
        iconName: "stars",
        buttonClass: "bg-primary text-white active:scale-[0.98] transition-transform shadow-md",
        statusText: "ELIGIBLE",
        isPremium: true
      };
    } else if (planName.toLowerCase().includes('executive') || planName.toLowerCase().includes('apex')) {
      return {
        cardClass: `bg-surface-container-lowest border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm relative ${isDisabled ? 'opacity-90' : ''}`,
        tagClass: "bg-slate-200 text-slate-500",
        textClass: isDisabled ? "text-slate-400" : "text-primary",
        iconClass: isDisabled ? "text-slate-300" : "text-secondary",
        iconName: isDisabled ? "lock" : "stars",
        buttonClass: "bg-white border border-slate-200 text-slate-400 cursor-not-allowed",
        statusText: "LOCKED",
        isPremium: false,
        isLocked: isDisabled
      };
    } else {
      // Starter
      return {
        cardClass: `bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm ${isDisabled ? 'opacity-80 grayscale-[0.3]' : ''}`,
        tagClass: "bg-slate-100 text-slate-600",
        textClass: "text-primary",
        iconClass: "text-slate-400",
        iconName: isDisabled ? "lock" : "lock_open",
        buttonClass: isDisabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-primary text-white active:scale-[0.98] transition-transform shadow-md",
        statusText: isDisabled ? "LOCKED" : "UNLOCKED",
        isPremium: false
      };
    }
  };

  const getEligibilityMessage = () => {
    if (!currentActivePlan) {
      return {
        title: "Current Eligibility: Starter",
        desc: "You are eligible for the Starter plan. Make an investment to unlock higher tiers."
      };
    }
    const planName = currentActivePlan.investment_plans.name;
    return {
      title: `Current Eligibility: ${planName}`,
      desc: `Based on your investment history, you are eligible for the ${planName} tier.`
    };
  };



  const eligibility = getEligibilityMessage();

  return (
    <div className="space-y-6 pb-20">
      {/* Wallet Overview Section */}
      <section className="space-y-4">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {upgradeMode ? 'Upgrade Plan' : 'Investment Plans'}
        </h1>
        <div className="bg-primary p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-20 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-on-primary-container font-label-md text-label-md">Total Investment Balance</span>
              <span className="material-symbols-outlined text-secondary-container">account_balance_wallet</span>
            </div>
            <div className="text-white">
              <p className="font-display-lg text-[32px] tracking-tight font-extrabold">${investmentBalance.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-on-primary-container text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                  Active Portfolio
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KYC Alert */}
      {!kycApproved && !kycLoading && (
        <section className="bg-error-container/10 p-4 rounded-xl border border-error/20 flex items-start gap-4">
          <div className="text-error">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-md text-sm font-bold text-error">KYC Required</h3>
            <p className="text-xs text-error opacity-80 leading-relaxed">
              Identity verification is required before you can create investments.
            </p>
          </div>
        </section>
      )}

      {upgradeMode && currentActivePlan && (
        <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-4">
          <div className="text-blue-500">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-headline-md text-sm font-bold text-blue-700 dark:text-blue-300">Upgrade Mode</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 opacity-80 leading-relaxed">
              Your highest tier is {currentActivePlan.investment_plans.name}. You can only upgrade to higher tiers.
            </p>
          </div>
        </section>
      )}

      {/* Eligibility Status */}
      <section className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-start gap-4">
        <div className="bg-secondary-container/20 p-2 rounded-lg text-secondary">
          <span className="material-symbols-outlined">info</span>
        </div>
        <div className="space-y-1">
          <h3 className="font-headline-md text-sm font-bold text-primary">{eligibility.title}</h3>
          <p className="text-on-surface-variant text-xs leading-relaxed">{eligibility.desc}</p>
        </div>
      </section>

      {/* Plan Grid */}
      <div className="space-y-6">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No investment plans available</p>
          </div>
        ) : (
          plans.map((plan) => {
            const isDisabled = isPlanDisabled(plan);
            const styles = getPlanStyles(plan.name, true, isDisabled);
            
            return (
              <div key={plan.id} className={styles.cardClass}>
                {styles.isPremium && !isDisabled && (
                  <div className="absolute -right-4 -top-4 bg-secondary-container text-white text-[10px] font-black px-8 py-4 rotate-45 flex items-center justify-center">ELIGIBLE</div>
                )}
                {styles.isLocked && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl z-0 pointer-events-none"></div>
                )}
                
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className={`${styles.tagClass} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                      {plan.name}
                    </span>
                    <h2 className={`text-xl md:text-2xl font-extrabold ${styles.textClass} mt-2`}>
                      {plan.profit_percentage}% ROI
                    </h2>
                  </div>
                  <span className={`material-symbols-outlined ${styles.iconClass}`}>
                    {styles.iconName}
                  </span>
                </div>

                <div className={`relative z-10 grid grid-cols-2 gap-4 py-2 border-y ${styles.isPremium ? 'border-secondary-container/10' : 'border-slate-50'}`}>
                  <div>
                    <p className={`text-[10px] ${styles.isPremium ? 'text-on-surface-variant' : 'text-slate-400'} font-medium uppercase`}>Min. Deposit</p>
                    <p className={`font-data-mono ${styles.textClass} ${styles.isPremium ? 'font-extrabold' : ''}`}>
                      ${plan.min_amount}
                    </p>
                  </div>
                  <div>
                    <p className={`text-[10px] ${styles.isPremium ? 'text-on-surface-variant' : 'text-slate-400'} font-medium uppercase`}>Max. Deposit</p>
                    <p className={`font-data-mono ${styles.textClass} ${styles.isPremium ? 'font-extrabold' : ''}`}>
                      {plan.max_amount ? `$${plan.max_amount}` : 'Unlimited'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span> 
                    {plan.duration_days < 1 ? `${plan.duration_days * 24} Hours` : `${plan.duration_days} Days`}
                  </span>
                  <span className={`font-bold ${styles.isLocked ? 'text-slate-400' : 'text-secondary'}`}>
                    {styles.statusText}
                  </span>
                </div>

                <button 
                  onClick={() => window.location.href = `/dashboard/invest?planId=${plan.id}${upgradeMode ? '&upgrade=true' : ''}`}
                  disabled={kycLoading || !kycApproved || isDisabled}
                  className={`w-full py-4 rounded-xl font-bold text-sm ${styles.buttonClass} relative z-10 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {kycLoading ? 'Loading...' : !kycApproved ? 'KYC Required' : isDisabled ? 'Locked' : upgradeMode ? (plan.min_amount === currentActivePlan?.investment_plans.min_amount ? 'Invest Again' : 'Upgrade to This Plan') : 'Invest Now'}
                </button>
              </div>
            );
          })
        )}
      </div>
      
      {/* Extra CTA */}
      <section className="bg-primary-container rounded-2xl p-6 text-center space-y-3">
        <h3 className="text-white font-headline-md text-lg">Custom Strategy?</h3>
        <p className="text-on-primary-container text-xs">For investments over $100,000, speak with a dedicated wealth advisor.</p>
        <button onClick={() => window.location.href = 'mailto:support@whitestonesmarkets.com'} className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold active:scale-95 transition-all">Contact Us</button>
      </section>
    </div>
  );
};

export default Plans;
