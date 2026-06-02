import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { KYCGuard, KYCStatusBadge } from '@/components/KYCGuard';
import { Skeleton } from '@/components/ui/skeleton';

const Withdraw = () => {
  const { isApproved, isPending, isRejected, rejectionReason, initialLoading: kycLoading } = useKYCStatus();
  const [amount, setAmount] = useState('');
  const [mainBalance, setMainBalance] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [highestPlanName, setHighestPlanName] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadWithdrawData = async () => {
      setAccountsLoading(true);
      setPlanLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [accountsRes, balanceRes, investmentsRes] = await Promise.all([
          supabase.from('withdrawal_accounts').select('*').eq('user_id', user.id),
          supabase.from('account_balances').select('main_balance').eq('user_id', user.id).maybeSingle(),
          supabase.from('investments').select('plan_id, investment_plans(name)').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        // set accounts
        setAccounts(accountsRes.data || []);
        
        // set balance
        if (balanceRes.data) {
          setMainBalance(parseFloat(String(balanceRes.data.main_balance || 0)));
        }

        // set highest plan
        const investments = investmentsRes.data;
        if (investments && investments.length > 0) {
          const planHierarchy = ['Starter', 'Platinum', 'Executive', 'Apex'];
          let highest = '';
          let highestIndex = -1;

          investments.forEach((inv: any) => {
            const planName = inv.investment_plans?.name || '';
            const index = planHierarchy.findIndex(p => planName.includes(p));
            if (index > highestIndex) {
              highestIndex = index;
              highest = planName;
            }
          });

          setHighestPlanName(highest || '');
        } else {
          setHighestPlanName('');
        }
      } catch (error) {
        console.error('Error loading withdrawal data:', error);
      } finally {
        setAccountsLoading(false);
        setPlanLoading(false);
      }
    };

    loadWithdrawData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is on Starter plan
    if (highestPlanName.includes('Starter')) {
      toast({
        title: 'Upgrade Required',
        description: 'You need to upgrade to the next plan to have access to withdrawals.',
        variant: 'destructive',
      });
      return;
    }

    // Validate balance
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount.',
        variant: 'destructive',
      });
      return;
    }

    if (mainBalance <= 0) {
      toast({
        title: 'Insufficient Balance',
        description: 'Your balance is $0. Please deposit funds first.',
        variant: 'destructive',
      });
      return;
    }

    if (withdrawAmount > mainBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You cannot withdraw more than your available balance of $${mainBalance.toFixed(2)}.`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        amount: withdrawAmount,
        account_id: selectedAccount,
        wallet_type: 'main',
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: 'Withdrawal Request Submitted',
        description: 'Your withdrawal is pending admin approval.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      {/* Page Header */}
      <div className="mt-4 mb-6">
        <h2 className="text-2xl font-bold text-primary">Withdraw Funds</h2>
        <p className="text-on-surface-variant text-label-md font-label-md mt-1">Move your capital to your verified account.</p>
      </div>

      <KYCGuard
        isApproved={isApproved}
        isPending={isPending}
        isRejected={isRejected}
        rejectionReason={rejectionReason || ''}
        actionName="Withdraw"
        isLoading={kycLoading}
      >
        {highestPlanName.includes('Starter') && (
          <div className="p-4 bg-error-container/10 border border-error/20 rounded-xl flex gap-3 items-start mb-6">
            <span className="material-symbols-outlined text-error">error</span>
            <div>
              <h3 className="text-label-md font-bold text-error">Upgrade Required</h3>
              <p className="text-xs text-error opacity-80 leading-relaxed mt-0.5">Withdrawals are not available on the Starter plan. Please upgrade to a higher plan.</p>
              <button onClick={() => navigate('/dashboard/plans')} className="text-xs font-bold text-error underline mt-1">Upgrade Now</button>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-primary text-on-primary shadow-lg mb-6">
          <div className="absolute -right-4 -top-8 w-32 h-32 bg-secondary rounded-full opacity-20 blur-2xl"></div>
          <div className="relative z-10">
            <span className="text-label-md font-label-md opacity-70">Available for Withdrawal</span>
            <div className="text-display-lg font-display-lg mt-1">${mainBalance.toFixed(2)}</div>
            <div className="flex items-center gap-2 mt-4 text-tertiary-fixed-dim">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-xs font-semibold tracking-wide">
                {mainBalance > 0 ? "Ready for transfer" : "Insufficient balance"}
              </span>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-label-md font-bold text-on-surface">Select Account</label>
              <button 
                type="button"
                onClick={() => navigate('/dashboard/withdrawal-accounts')}
                className="text-secondary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Manage accounts
              </button>
            </div>
            
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-outline-variant rounded-xl p-4 pr-10 text-label-md font-bold focus:border-secondary outline-none shadow-sm cursor-pointer"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={!canWithdraw || accounts.length === 0}
                required
              >
                <option value="" disabled>Select withdrawal account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name} ({account.account_type})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline-variant">expand_more</span>
              </div>
            </div>
            {accounts.length === 0 && (
              <p className="text-xs text-error font-medium px-1">You must add a withdrawal account first.</p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-label-md font-bold text-on-surface px-1">Amount to Withdraw</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-headline-md font-bold text-outline">$</div>
              <input 
                className="w-full bg-white border-2 border-outline-variant focus:border-secondary rounded-xl py-4 pl-10 pr-16 text-headline-md font-headline-md outline-none transition-all placeholder:text-outline-variant" 
                placeholder="0.00" 
                type="number"
                step="0.01"
                min="0"
                max={mainBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canWithdraw}
                required
              />
              <button 
                type="button"
                onClick={() => setAmount(mainBalance.toString())}
                disabled={!canWithdraw}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface-container text-secondary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-secondary hover:text-white transition-colors disabled:opacity-50"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-xs text-on-surface-variant">Fee: $0.00</span>
              <span className="text-xs text-on-surface-variant">Processing: 2-3 Days</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button 
              type="submit" 
              disabled={loading || !canWithdraw || accounts.length === 0}
              title={withdrawDisabledReason}
              className="w-full py-4 bg-primary text-white rounded-full text-label-md font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:shadow-none"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/dashboard/transactions?tab=withdrawals')}
              className="w-full py-4 flex items-center justify-center gap-2 text-on-surface-variant font-bold text-label-md border-2 border-outline-variant rounded-2xl hover:bg-surface-container transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-md">history</span>
              View History
            </button>
          </div>
        </form>

        {/* Security Badge */}
        <div className="flex flex-col items-center justify-center py-6 opacity-40">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">Encrypted Transaction</span>
          </div>
        </div>
      </KYCGuard>
    </>
  );
};

export default Withdraw;
