import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2 } from 'lucide-react';

interface WalletsOverviewProps {
  refreshTrigger?: number;
  onTransferSuccess?: () => void;
}

export const WalletsOverview: React.FC<WalletsOverviewProps> = ({
  refreshTrigger = 0,
  onTransferSuccess,
}) => {
  const [mainBalance, setMainBalance] = useState(0);
  const [investmentBalance, setInvestmentBalance] = useState(0);
  const [profitBalance, setProfitBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchBalances();
  }, [refreshTrigger]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('account_balances')
        .select('main_balance, investment_balance, profit_balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setMainBalance(parseFloat(String(data?.main_balance || 0)));
      setInvestmentBalance(parseFloat(String(data?.investment_balance || 0)));
      setProfitBalance(parseFloat(String(data?.profit_balance || 0)));
    } catch (error: any) {
      console.error('Error fetching balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet balances',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (amount > mainBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have $${mainBalance.toFixed(2)} available`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setTransferLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the wallet-transfer edge function via Supabase client
      const { data, error } = await supabase.functions.invoke('wallet-transfer', {
        body: {
          user_id: user.id,
          from_wallet: 'main',
          to_wallet: 'investment',
          amount,
        },
      });

      if (error) {
        console.error('wallet-transfer error:', error);
        throw new Error(error.message || 'Transfer failed');
      }

      const result = data as any;

      setMainBalance(result.new_main_balance);
      setInvestmentBalance(result.new_investment_balance);
      setTransferAmount('');
      setShowTransferForm(false);

      toast({
        title: 'Transfer Successful',
        description: `Transferred $${amount.toFixed(2)} to Investment wallet`,
      });

      if (onTransferSuccess) {
        onTransferSuccess();
      }

      // Refresh balances after transfer
      setTimeout(() => fetchBalances(), 500);
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to transfer funds',
        variant: 'destructive',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const totalBalance = mainBalance + investmentBalance + profitBalance;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Total Balance Overview */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Total Balance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl md:text-4xl font-bold text-primary">
            ${totalBalance.toFixed(2)}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
            Across all wallets and accounts
          </p>
        </CardContent>
      </Card>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Main Wallet */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base">Main Wallet</CardTitle>
            <CardDescription className="text-xs md:text-sm">Primary account for deposits & withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 md:space-y-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl md:text-3xl font-bold text-success">
                  ${mainBalance.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={() => setShowTransferForm(!showTransferForm)}
                className="w-full text-xs md:text-sm h-8 md:h-10"
                variant={showTransferForm ? 'secondary' : 'default'}
              >
                {showTransferForm ? 'Cancel' : 'Transfer to Investment'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Investment Wallet */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base">Investment Wallet</CardTitle>
            <CardDescription className="text-xs md:text-sm">Used for investment purchases</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 md:space-y-3">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl md:text-3xl font-bold text-blue-600">
                  ${investmentBalance.toFixed(2)}
                </p>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                ℹ️ Funds locked in active investments
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profit Wallet */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base">Profit Balance</CardTitle>
            <CardDescription className="text-xs md:text-sm">Earnings from investments</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 md:space-y-3">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Accumulated Profits</p>
                <p className="text-xl md:text-3xl font-bold text-purple-600">
                  ${profitBalance.toFixed(2)}
                </p>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                ℹ️ Auto-credited when investments mature
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Form - Mobile Dialog */}
      {isMobile && showTransferForm && (
        <Dialog open={showTransferForm} onOpenChange={setShowTransferForm}>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4" />
                Transfer Funds
              </DialogTitle>
              <DialogDescription className="text-xs">
                Move funds from Main wallet to Investment wallet
              </DialogDescription>
            </DialogHeader>
            
            <Alert className="mb-3">
              <AlertDescription className="text-xs">
                Only transfers from Main → Investment are allowed. You can reinvest after
                investments mature.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleTransfer} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="transfer-amount" className="text-xs">Amount to Transfer</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={mainBalance}
                  placeholder="Enter amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="text-sm h-9"
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Max: ${mainBalance.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-background rounded-lg border">
                  <p className="text-muted-foreground">From (Main)</p>
                  <p className="font-semibold mt-0.5">
                    ${(mainBalance - parseFloat(transferAmount || '0')).toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-background rounded-lg border">
                  <p className="text-muted-foreground">To (Investment)</p>
                  <p className="font-semibold mt-0.5">
                    ${(investmentBalance + parseFloat(transferAmount || '0')).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs h-9"
                disabled={transferLoading || !transferAmount}
              >
                {transferLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-3.5 w-3.5" />
                    Confirm Transfer
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Transfer Form - Desktop Card */}
      {!isMobile && showTransferForm && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              Transfer Funds
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Move funds from Main wallet to Investment wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-3 md:mb-4">
              <AlertDescription className="text-xs md:text-sm">
                Only transfers from Main → Investment are allowed. You can reinvest after
                investments mature.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleTransfer} className="space-y-3 md:space-y-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="transfer-amount" className="text-xs md:text-sm">Amount to Transfer</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={mainBalance}
                  placeholder="Enter amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="text-sm h-9 md:h-10"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Max: ${mainBalance.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                <div className="p-2.5 md:p-3 bg-background rounded-lg border">
                  <p className="text-muted-foreground">From (Main)</p>
                  <p className="font-semibold mt-0.5">
                    ${(mainBalance - parseFloat(transferAmount || '0')).toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 md:p-3 bg-background rounded-lg border">
                  <p className="text-muted-foreground">To (Investment)</p>
                  <p className="font-semibold mt-0.5">
                    ${(investmentBalance + parseFloat(transferAmount || '0')).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs md:text-sm h-9 md:h-10"
                disabled={transferLoading || !transferAmount}
              >
                {transferLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Confirm Transfer
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WalletsOverview;
