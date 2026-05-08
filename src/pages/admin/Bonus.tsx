import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';
import { Search, Gift, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">Bonus Management</h1>
        <p className="text-muted-foreground">Send bonuses to user accounts</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Select User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedUser?.user_id === user.user_id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.country || 'N/A'}</p>
                    </div>
                    <Badge variant="secondary">
                      ${user.main_balance.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bonus Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Send Bonus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser ? (
              <>
                <div className="p-4 rounded-lg bg-accent border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current Balance: ${selectedUser.main_balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bonus Type</Label>
                  <RadioGroup value={bonusType} onValueChange={(value: 'direct' | 'redeemable') => setBonusType(value)}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-all">
                      <RadioGroupItem value="direct" id="direct" />
                      <Label htmlFor="direct" className="flex-1 cursor-pointer">
                        <span className="font-medium">Direct Bonus</span>
                        <p className="text-xs text-muted-foreground">Added immediately to user balance</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-all">
                      <RadioGroupItem value="redeemable" id="redeemable" />
                      <Label htmlFor="redeemable" className="flex-1 cursor-pointer">
                        <span className="font-medium">Redeemable Bonus</span>
                        <p className="text-xs text-muted-foreground">User must claim it from their dashboard</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Bonus Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    {bonusType === 'direct' ? 'Notification Message' : 'Bonus Message'}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={bonusType === 'direct' 
                      ? "Enter the notification message..."
                      : "Enter the bonus message (user will see this when redeeming)..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bonusType === 'direct' 
                      ? 'This message will appear in the user\'s notification center'
                      : 'This message will be shown when the user redeems the bonus'
                    }
                  </p>
                </div>

                <Button
                  onClick={handleSendBonus}
                  disabled={sending}
                  className="w-full"
                >
                  <Gift className="mr-2 h-4 w-4" />
                  {sending ? 'Sending...' : bonusType === 'direct' ? 'Send Direct Bonus' : 'Create Redeemable Bonus'}
                </Button>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a user to send a bonus</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bonus;