import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Wallet, CheckCircle2, TrendingUp, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const InvestmentPreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [investmentBalance, setInvestmentBalance] = useState<number>(0);

  const planId = searchParams.get('planId');

  useEffect(() => {
    if (!planId) {
      navigate('/dashboard/plans');
      return;
    }
    fetchPlanDetails();
    fetchBalance();
  }, [planId]);

  const fetchPlanDetails = async () => {
    const { data } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (data) {
      setPlan(data);
    } else {
      navigate('/dashboard/plans');
    }
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

  const expectedProfit = amount ? (parseFloat(amount) * plan?.profit_percentage) / 100 : 0;
  const totalReturn = amount ? parseFloat(amount) + expectedProfit : 0;

  const handleProceed = () => {
    const investAmount = parseFloat(amount);
    if (!investAmount || investAmount < plan.min_amount || (plan.max_amount && investAmount > plan.max_amount)) {
      toast({
        title: 'Invalid Amount',
        description: `Please enter an amount between $${plan.min_amount} and $${plan.max_amount || 'unlimited'}`,
        variant: 'destructive',
      });
      return;
    }

    if (investAmount > investmentBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You have $${investmentBalance.toFixed(2)} in your investment wallet.`,
        variant: 'destructive',
      });
      return;
    }

    setStep(2);
  };

  const handleConfirmInvestment = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const investAmount = parseFloat(amount);
      const expectedProfit = (investAmount * plan.profit_percentage) / 100;
      const endDate = new Date();
      const durationMs = plan.duration_days * 24 * 60 * 60 * 1000;
      endDate.setTime(endDate.getTime() + durationMs);

      // Get current balances
      const { data: balances } = await supabase
        .from('account_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!balances) throw new Error('Account not found');

      // Calculate new balances: deduct from investment wallet
      const newInvestmentBalance = balances.investment_balance - investAmount;

      // Update balances
      const { error: balanceError } = await supabase
        .from('account_balances')
        .update({
          investment_balance: newInvestmentBalance,
        })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Create investment record
      const { error: investmentError } = await supabase.from('investments').insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: investAmount,
        expected_profit: expectedProfit,
        end_date: endDate.toISOString(),
        start_date: new Date().toISOString(),
        status: 'active'
      });

      if (investmentError) throw investmentError;

      // Log transaction
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'investment',
          amount: investAmount,
          balance_after: balances.main_balance,
          description: `Investment in ${plan.name}`,
        }]);

      const durationDisplay = plan.duration_days < 1 
        ? `${plan.duration_days * 24} hours` 
        : `${plan.duration_days} days`;

      // Send notification
      await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: 'Investment Started!',
          message: `You've invested $${investAmount} in ${plan.name} with ${plan.profit_percentage}% ROI. Expected profit: $${expectedProfit.toFixed(2)}. Funds will be returned in ${durationDisplay}.`,
          category: 'investment_updates',
        }]);

      setStep(3);
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

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">Loading plan details...</div>
      </div>
    );
  }

  // Step 3: Success Page
  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="relative inline-block animate-scale-in">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-primary/60 rounded-full p-6 inline-block">
                <Sparkles className="w-16 h-16 text-primary-foreground animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Congratulations!
              </h1>
              <p className="text-xl text-muted-foreground">
                Your investment has been created successfully
              </p>
            </div>

            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-semibold">{plan.name}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Investment Amount</span>
                <span className="font-semibold text-lg">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expected Profit</span>
                <span className="font-semibold text-lg text-green-600">${expectedProfit.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Return</span>
                <span className="font-bold text-2xl text-primary">${totalReturn.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Button 
                onClick={() => navigate('/dashboard/investments')} 
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                View My Investments
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Confirmation Page
  if (step === 2) {
    const durationDisplay = plan.duration_days < 1 
      ? `${plan.duration_days * 24} hours` 
      : `${plan.duration_days} days`;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setStep(1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Confirm Your Investment</CardTitle>
            </div>
            <CardDescription>Please review the details before confirming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Investment Plan Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Investment Plan
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan Name</span>
                  <Badge variant="secondary" className="text-base">{plan.name}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ROI</span>
                  <span className="font-semibold text-primary text-lg">{plan.profit_percentage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Duration
                  </span>
                  <span className="font-semibold">{durationDisplay}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Financial Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Financial Breakdown
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Investment Amount</span>
                  <span className="font-semibold text-xl">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expected Profit</span>
                  <span className="font-semibold text-xl text-green-600">+${expectedProfit.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Return</span>
                  <span className="font-bold text-2xl text-primary">${totalReturn.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Payment Method
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Investment Wallet</p>
                      <p className="text-sm text-muted-foreground">Available: ${investmentBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <Button 
                onClick={handleConfirmInvestment} 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Investment'}
              </Button>
              <Button 
                onClick={() => setStep(1)} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                Review Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Investment Preview
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard/plans')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Plans
      </Button>

      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Plan Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
              <p className="text-3xl font-bold text-primary">{plan.profit_percentage}%</p>
              <p className="text-sm text-muted-foreground">ROI</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
              <p className="text-2xl font-bold">${plan.min_amount}+</p>
              <p className="text-sm text-muted-foreground">Minimum</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1 col-span-2 md:col-span-1">
              <p className="text-2xl font-bold">
                {plan.duration_days < 1 ? `${plan.duration_days * 24}h` : `${plan.duration_days}d`}
              </p>
              <p className="text-sm text-muted-foreground">Duration</p>
            </div>
          </div>

          <Separator />

          {/* Investment Amount Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">
                Investment Amount (USD)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={plan.min_amount}
                max={plan.max_amount || investmentBalance}
                placeholder={`Enter amount (Min: $${plan.min_amount}${plan.max_amount ? `, Max: $${plan.max_amount}` : ''})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-12"
              />
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Range: ${plan.min_amount} - ${plan.max_amount || 'Unlimited'}
                </p>
                <p className="text-muted-foreground">
                  Available: ${investmentBalance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Expected Returns */}
            {amount && parseFloat(amount) >= plan.min_amount && (
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expected Profit</span>
                  <span className="text-lg font-semibold text-green-600">
                    +${expectedProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Return</span>
                  <span className="text-xl font-bold text-primary">
                    ${totalReturn.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method</Label>
            <div className="bg-muted/50 border-2 border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-3">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Investment Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Balance: ${investmentBalance.toFixed(2)}
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your investment will be deducted from your Investment Wallet
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleProceed} 
              className="w-full" 
              size="lg"
              disabled={!amount || parseFloat(amount) < plan.min_amount}
            >
              Proceed to Confirmation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentPreview;
