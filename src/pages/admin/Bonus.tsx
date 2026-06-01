import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  country: string;
  main_balance: number;
}

const Bonus = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [bonusType, setBonusType] = useState<'direct' | 'redeemable'>('direct');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, country');

      if (profilesError) throw profilesError;

      const { data: balances, error: balancesError } = await supabase
        .from('account_balances')
        .select('user_id, main_balance');

      if (balancesError) throw balancesError;

      const combinedUsers = profiles?.map(profile => {
        const balance = balances?.find(b => b.user_id === profile.user_id);
        return {
          ...profile,
          main_balance: balance?.main_balance || 0,
        };
      }) || [];

      setUsers(combinedUsers);
      setFilteredUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase()) ||
      user.user_id?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSendBonus = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('send-bonus', {
        body: {
          user_id: selectedUser.user_id,
          admin_id: user.id,
          amount: parseFloat(amount),
          notification_message: message,
          bonus_type: bonusType,
        },
      });

      if (error) throw error;

      const successMsg = bonusType === 'direct' 
        ? `Direct bonus sent to ${selectedUser.full_name}` 
        : `Redeemable bonus created for ${selectedUser.full_name}`;
      
      toast.success(successMsg);
      setSelectedUser(null);
      setAmount('');
      setMessage('');
      setBonusType('direct');
      fetchUsers();
    } catch (error) {
      console.error('Error sending bonus:', error);
      toast.error('Failed to send bonus');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">Bonus Management</h1>
        <p className="text-xs text-slate-500 mt-1">Distribute direct wallet bonuses or create redeemable bonuses for users</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* User Selection */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">1. Select Target User</CardTitle>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <Input
                  placeholder="Search by name, email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedUser?.user_id === user.user_id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{user.full_name || 'Unnamed'}</p>
                        <p className="text-[11px] text-slate-500">{user.email}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.country || 'N/A'}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350">
                        ${parseFloat(user.main_balance.toString()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <p className="text-center text-slate-500 py-8 text-xs font-semibold">No users found matching query</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bonus Form */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">2. Configure Bonus</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {selectedUser ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{selectedUser.full_name}</p>
                      <p className="text-[11px] text-slate-500">{selectedUser.email}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Current Bal: ${parseFloat(selectedUser.main_balance.toString()).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-slate-900 dark:text-white">Bonus Type</Label>
                  <RadioGroup value={bonusType} onValueChange={(value: 'direct' | 'redeemable') => setBonusType(value)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-slate-250 dark:hover:border-slate-700 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-850/20">
                      <RadioGroupItem value="direct" id="direct" />
                      <Label htmlFor="direct" className="flex-1 cursor-pointer space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Direct Bonus</span>
                        <p className="text-[10px] text-slate-400 font-medium">Credited to wallet balance immediately</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-slate-250 dark:hover:border-slate-700 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-850/20">
                      <RadioGroupItem value="redeemable" id="redeemable" />
                      <Label htmlFor="redeemable" className="flex-1 cursor-pointer space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Redeemable Bonus</span>
                        <p className="text-[10px] text-slate-400 font-medium">User manually redeems from dashboard</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="amount" className="text-xs font-bold text-slate-900 dark:text-white">Bonus Amount ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      className="rounded-xl border-slate-200 dark:border-slate-800 pl-7 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="message" className="text-xs font-bold text-slate-900 dark:text-white">
                    {bonusType === 'direct' ? 'Notification Message' : 'Redemption Message'}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={bonusType === 'direct' 
                      ? "Enter the notification message explaining the credit..."
                      : "Enter the bonus description the user will see when claiming..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {bonusType === 'direct' 
                      ? 'This message will appear in the user\'s notifications list.'
                      : 'This description will show on the user\'s "claim bonus" container.'
                    }
                  </p>
                </div>

                <Button
                  onClick={handleSendBonus}
                  disabled={sending}
                  className="w-full rounded-xl text-xs font-bold h-11 bg-primary text-white"
                >
                  {sending ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] mr-1.5">redeem</span>
                      {bonusType === 'direct' ? 'Send Direct Bonus' : 'Create Redeemable Bonus'}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[48px] opacity-40">redeem</span>
                <p className="text-xs font-bold">Select a user to send a bonus</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bonus;