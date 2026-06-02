import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';

export const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [updatingControls, setUpdatingControls] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  // Stats state
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [currentPlanName, setCurrentPlanName] = useState('No Active Plan');

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Form state for adjustments
  const [wallet, setWallet] = useState<'main' | 'investment'>('main');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchAdminNotes();
      fetchPlans();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, account_balances(*), kyc_documents(*)')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser(profile);
        setFullName(profile.full_name || '');
        setUserEmail(profile.email || '');
        setPhone(profile.phone || profile.phone_number || '');
        setCountry(profile.country || '');
        setState(profile.state || '');
        setCity(profile.city || '');
        setAddress(profile.address || '');

        // Fetch investments and withdrawals in parallel to avoid waterfalls
        const [investmentsRes, withdrawalsRes] = await Promise.all([
          supabase
            .from('investments')
            .select('*, investment_plans(name, min_amount)')
            .eq('user_id', profile.user_id),
          supabase
            .from('withdrawals')
            .select('amount')
            .eq('user_id', profile.user_id)
            .eq('status', 'completed')
        ]);

        const investments = investmentsRes.data;
        const withdrawals = withdrawalsRes.data;

        const totalInv = investments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
        setTotalInvested(totalInv);

        const totalWith = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
        setTotalWithdrawn(totalWith);

        // Resolve current plan (override takes precedence)
        let resolvedPlanName = 'No Active Plan';
        if (profile.current_plan_override_id) {
          const { data: overridePlan } = await supabase
            .from('investment_plans')
            .select('name')
            .eq('id', profile.current_plan_override_id)
            .maybeSingle();
          if (overridePlan) {
            resolvedPlanName = overridePlan.name;
          }
        } else if (investments && investments.length > 0) {
          const highestTierInvestment = [...investments].sort((a, b) => {
            const planA = (a as any).investment_plans;
            const planB = (b as any).investment_plans;
            return (planB?.min_amount || 0) - (planA?.min_amount || 0);
          })[0];
          resolvedPlanName = (highestTierInvestment as any).investment_plans?.name || 'No Active Plan';
        }
        setCurrentPlanName(resolvedPlanName);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('min_amount');
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching investment plans:', error);
    }
  };

  const fetchAdminNotes = async () => {
    try {
      setLoadingNotes(true);
      const { data: notes } = await supabase
        .from('admin_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setAdminNotes(notes || []);
    } catch (error) {
      console.error('Error fetching admin notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAdjustFunds = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!reason) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    try {
      setAdjusting(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        toast.error('Admin authentication required');
        return;
      }

      const adjustmentAmount = parseFloat(amount);

      const { data, error } = await supabase.functions.invoke('admin-adjust-funds', {
        body: {
          user_id: userId,
          admin_id: authUser.id,
          wallet,
          amount: adjustmentAmount,
          reason,
          notes: notes || undefined,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to adjust funds');
        return;
      }

      if (data?.success) {
        toast.success(`Adjusted ${wallet} wallet by $${adjustmentAmount.toFixed(2)}`);
        setAmount('');
        setReason('');
        setNotes('');
        await fetchUserDetails();
        await fetchAdminNotes();
      }
    } catch (error) {
      console.error('Error adjusting funds:', error);
      toast.error('Failed to adjust funds');
    } finally {
      setAdjusting(false);
    }
  };

  const handleToggleSuspension = async () => {
    if (!user) return;
    try {
      setUpdatingControls(true);
      const nextSuspendedState = !user.is_suspended;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: nextSuspendedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(nextSuspendedState ? 'User account suspended / banned' : 'User account unsuspended / unbanned');
      await fetchUserDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update account status');
    } finally {
      setUpdatingControls(false);
    }
  };

  const handleUpdatePlanOverride = async (planId: string) => {
    if (!user) return;
    try {
      setUpdatingControls(true);
      const overrideVal = planId === 'auto' ? null : planId;

      const { error } = await supabase
        .from('profiles')
        .update({
          current_plan_override_id: overrideVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Current plan override updated successfully');
      await fetchUserDetails();
    } catch (error: any) {
      console.error('Error updating plan override:', error);
      toast.error(error.message || 'Failed to update plan override');
    } finally {
      setUpdatingControls(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      toast.error('Full Name is required');
      return;
    }

    try {
      setUpdatingProfile(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: userEmail,
          phone: phone,
          phone_number: phone,
          country: country,
          state: state,
          city: city,
          address: address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('User profile information updated successfully');
      await fetchUserDetails();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile information');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/users')} className="rounded-xl h-10 text-xs">
          <span className="material-symbols-outlined text-sm mr-2">arrow_back</span>
          Back to Users
        </Button>
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-8 text-center text-xs font-semibold text-slate-500">
            User not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainBalance = user ? parseFloat(user.account_balances?.[0]?.main_balance || '0') : 0;
  const investmentBalance = user ? parseFloat(user.account_balances?.[0]?.investment_balance || '0') : 0;
  const kycStatus = user ? (user.kyc_documents?.[0]?.status || 'not_submitted') : 'not_submitted';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/users')} className="rounded-xl h-10 text-xs self-start">
          <span className="material-symbols-outlined text-[16px] mr-1.5">arrow_back</span>
          Back
        </Button>
        
        <div className="sm:text-right">
          <div className="flex items-center sm:justify-end gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">
              {loading ? (
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                user.full_name
              )}
            </h1>
            {user?.is_suspended && !loading && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspended / Banned</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {loading ? (
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              user.email
            )}
          </div>
        </div>
      </div>

      {/* User Info Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main Wallet</p>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {loading ? (
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                `$${mainBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">account_balance_wallet</span>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Investment Wallet</p>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {loading ? (
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                `$${investmentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">trending_up</span>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Investment</p>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {loading ? (
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                `$${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">payments</span>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Withdrawal</p>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {loading ? (
                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                `$${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">price_change</span>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Plan</p>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
              {loading ? (
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                currentPlanName
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">workspace_premium</span>
        </div>

        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">KYC Status</p>
            <div className="pt-1">
              {loading ? (
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  kycStatus === 'approved' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : kycStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {kycStatus === 'approved' ? 'Approved' : kycStatus === 'pending' ? 'Pending Review' : 'Not Verified'}
                </span>
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-[24px]">verified_user</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left column: Admin controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Controls Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Management</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Account Status Control */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-slate-900 dark:text-white">Account Status (Suspend / Ban)</Label>
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                  user.is_suspended 
                    ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30' 
                    : 'bg-green-50/50 dark:bg-green-955/10 border-green-200 dark:border-green-900/30'
                }`}>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    {user.is_suspended 
                      ? 'This account is currently banned/suspended. The user cannot access their dashboard, create investments, or execute transactions.' 
                      : 'This account is active. The user has full platform features unlocked (subject to standard verification limits).'}
                  </p>
                  <Button
                    onClick={handleToggleSuspension}
                    disabled={updatingControls}
                    className={`w-full rounded-xl text-xs font-bold h-10 ${
                      user.is_suspended 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {updatingControls ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    ) : user.is_suspended ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] mr-1.5">lock_open</span>
                        Unban / Unsuspend Account
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px] mr-1.5">gavel</span>
                        Ban / Suspend Account
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Current Plan Override Control */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-slate-900 dark:text-white">Active Plan Override</Label>
                <div className="space-y-2">
                  <Select
                    value={user.current_plan_override_id || 'auto'}
                    onValueChange={handleUpdatePlanOverride}
                    disabled={updatingControls}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10">
                      <SelectValue placeholder="Select plan override" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="auto">Automatic (Compute by investment tier)</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Setting an override bypasses the default calculation based on active investments and locks the dashboard display to the chosen plan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Edit Profile, Fund adjustment and history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Information Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Edit Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userEmail" className="text-xs font-bold">Email Address</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs font-bold">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-xs font-bold">State / Region</Label>
                    <Input
                      id="state"
                      placeholder="California"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-bold">City</Label>
                    <Input
                      id="city"
                      placeholder="Los Angeles"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold">Residential Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, Apt 4B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                  />
                </div>

                <Button type="submit" disabled={updatingProfile} className="w-full rounded-xl text-xs font-bold h-11 bg-primary text-white">
                  {updatingProfile ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] mr-1.5">save</span>
                      Save Profile Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fund Adjustment Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Adjust Wallet Funds</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleAdjustFunds} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet" className="text-xs font-bold">Wallet Target</Label>
                    <Select value={wallet} onValueChange={(val: any) => setWallet(val)}>
                      <SelectTrigger id="wallet" className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                        <SelectItem value="main">Main Wallet</SelectItem>
                        <SelectItem value="investment">Investment Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-xs font-bold">Amount Adjust (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="rounded-xl border-slate-200 dark:border-slate-800 pl-7 text-xs bg-slate-50 dark:bg-slate-850 h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-xs font-bold">Adjustment Reason</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger id="reason" className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850 h-10">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectItem value="manual_deposit">Manual Deposit Credited</SelectItem>
                      <SelectItem value="manual_withdrawal">Manual Withdrawal Debited</SelectItem>
                      <SelectItem value="correction">Account Correction</SelectItem>
                      <SelectItem value="bonus">Promo Bonus Credit</SelectItem>
                      <SelectItem value="compensation">System Compensation</SelectItem>
                      <SelectItem value="testing">Account Testing</SelectItem>
                      <SelectItem value="other">Other / Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-bold">Internal Audit Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Provide details about why this fund correction is made..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2.5}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-850"
                  />
                </div>

                <Button type="submit" disabled={adjusting} className="w-full rounded-xl text-xs font-bold h-11 bg-primary text-white">
                  {adjusting ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] mr-1.5">account_balance</span>
                      Adjust User Wallet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Adjustment History Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Adjustment History</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {loadingNotes ? (
                <div className="flex justify-center p-4">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
                </div>
              ) : adminNotes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-medium">No fund corrections recorded for this account.</p>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {adminNotes.map((note) => (
                    <div key={note.id} className="border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-850/30">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{note.note}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 font-medium">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {note.metadata && (
                        <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100/50 dark:border-slate-800/50 pt-1.5 mt-1.5 flex flex-wrap gap-x-4">
                          {note.metadata.amount !== undefined && (
                            <div>
                              <span className="font-semibold text-slate-400">Amount:</span> ${Math.abs(note.metadata.amount).toFixed(2)}
                            </div>
                          )}
                          {note.metadata.reason && (
                            <div>
                              <span className="font-semibold text-slate-400">Reason:</span> {note.metadata.reason}
                            </div>
                          )}
                          {note.metadata.admin_notes && (
                            <div className="w-full mt-0.5">
                              <span className="font-semibold text-slate-400">Audit details:</span> "{note.metadata.admin_notes}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
