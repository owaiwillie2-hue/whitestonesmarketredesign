import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2 } from 'lucide-react';

const WithdrawalAccounts = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('withdrawal_accounts')
      .select('*')
      .eq('user_id', user.id);

    setAccounts(data || []);
  };

  const handleAddAccount = async (type: string, formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate required fields
      if (!formData || Object.keys(formData).length === 0) {
        throw new Error('Please fill in all required fields');
      }

      if (type === 'bank' && (!formData.name || !formData.accountNumber || !formData.routingNumber || !formData.bankName)) {
        throw new Error('Please fill in all bank account fields');
      }

      if (type === 'crypto' && (!formData.name || !formData.address)) {
        throw new Error('Please fill in all crypto wallet fields');
      }

      if (type === 'paypal' && !formData.email) {
        throw new Error('Please enter a PayPal email');
      }

      const { error } = await supabase.from('withdrawal_accounts').insert([{
        user_id: user.id,
        account_type: type,
        account_details: formData
      }]);

      if (error) throw error;

      toast({
        title: 'Account Added',
        description: 'Withdrawal account has been added successfully.',
      });

      fetchAccounts();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('withdrawal_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Account Deleted',
        description: 'Withdrawal account has been removed.',
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const BankForm = () => {
    const [formData, setFormData] = useState<any>({});

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Account Holder Name <span className="text-destructive">*</span></Label>
          <Input 
            required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Account Number <span className="text-destructive">*</span></Label>
          <Input 
            required
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Routing Number <span className="text-destructive">*</span></Label>
          <Input 
            required
            onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Bank Name <span className="text-destructive">*</span></Label>
          <Input 
            required
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Swift Code/BIC <span className="text-destructive">*</span></Label>
          <Input 
            required
            onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })} 
          />
        </div>
        <Button onClick={() => handleAddAccount('bank', formData)} className="w-full">
          Add Account
        </Button>
      </div>
    );
  };

  const CryptoForm = () => {
    const [formData, setFormData] = useState<any>({});

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Wallet Name <span className="text-destructive">*</span></Label>
          <select
            required
            className="w-full p-2 border rounded-md bg-background"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          >
            <option value="">Select wallet</option>
            <option value="Bitcoin">Bitcoin</option>
            <option value="Ethereum">Ethereum</option>
            <option value="Litecoin">Litecoin</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Wallet Address <span className="text-destructive">*</span></Label>
          <Input 
            required
            onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
          />
        </div>
        <Button onClick={() => handleAddAccount('crypto', formData)} className="w-full">
          Add Wallet
        </Button>
      </div>
    );
  };

  const PayPalForm = () => {
    const [formData, setFormData] = useState<any>({});

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>PayPal Email <span className="text-destructive">*</span></Label>
          <Input 
            type="email"
            required
            placeholder="your@email.com"
            onChange={(e) => setFormData({ ...formData, name: 'PayPal', email: e.target.value })} 
          />
        </div>
        <Button onClick={() => handleAddAccount('paypal', formData)} className="w-full">
          Add PayPal
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
        <h2 className="font-headline-md text-headline-md">Withdrawal Methods</h2>
      </div>

      <div className="grid gap-3">
        {accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No withdrawal accounts added yet
          </p>
        ) : (
          accounts.map((account) => {
            const details = account.account_details as any;
            const displayName = details?.name || details?.email || 'Unknown Account';
            let icon = 'account_balance';
            let iconColor = 'bg-blue-100 text-blue-600';
            
            if (account.account_type === 'crypto') {
              icon = 'currency_bitcoin';
              iconColor = 'bg-orange-100 text-orange-600';
            } else if (account.account_type === 'paypal') {
              icon = 'payments';
              iconColor = 'bg-blue-100 text-blue-600';
            }

            return (
              <div key={account.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-slate-100 relative group">
                <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-on-surface">{displayName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {account.account_type === 'bank' && details?.accountNumber ? `****${details.accountNumber.slice(-4)}` : ''}
                    {account.account_type === 'crypto' && details?.address ? `${details.address.slice(0, 8)}...${details.address.slice(-6)}` : ''}
                    {account.account_type === 'paypal' && details?.email ? details.email : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 text-error"
                  onClick={() => handleDelete(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-label-md flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined">add</span>
            Add New Method
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Withdrawal Account</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="bank">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bank">Bank</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
            </TabsList>
            <TabsContent value="bank">
              <BankForm />
            </TabsContent>
            <TabsContent value="crypto">
              <CryptoForm />
            </TabsContent>
            <TabsContent value="paypal">
              <PayPalForm />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalAccounts;
