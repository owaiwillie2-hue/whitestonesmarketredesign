import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

export const AdminUsersPlans = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch investment plans first (all plans, active or inactive)
      const { data: plansData } = await supabase
        .from('investment_plans')
        .select('*')
        .order('min_amount', { ascending: true });
      
      const activePlans = plansData || [];
      setPlans(activePlans);

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const userIds = profilesData.map((p: any) => p.user_id);

      // Fetch completed deposits and investments in parallel
      const [depositsRes, investmentsRes] = await Promise.all([
        supabase
          .from('deposits')
          .select('user_id, amount')
          .eq('status', 'completed')
          .in('user_id', userIds),
        supabase
          .from('investments')
          .select('*, investment_plans(*)')
          .in('user_id', userIds),
      ]);

      const depositsData = depositsRes.data || [];
      const investmentsData = investmentsRes.data || [];

      // Group deposits and investments by user_id
      const depositsByUser: Record<string, number> = {};
      depositsData.forEach((d: any) => {
        const userId = d.user_id;
        depositsByUser[userId] = (depositsByUser[userId] || 0) + Number(d.amount);
      });

      const investmentsByUser: Record<string, any[]> = {};
      investmentsData.forEach((inv: any) => {
        const userId = inv.user_id;
        if (!investmentsByUser[userId]) {
          investmentsByUser[userId] = [];
        }
        investmentsByUser[userId].push(inv);
      });

      // Combine user details, deposits, current plan, and eligibility
      const combined = profilesData.map((profile: any) => {
        const totalDeposited = depositsByUser[profile.user_id] || 0;
        const userInvs = investmentsByUser[profile.user_id] || [];

        // 1. Determine natural highest plan based on active investments
        let naturalPlan: any = null;
        if (userInvs.length > 0) {
          const sortedInvs = [...userInvs].sort((a: any, b: any) => {
            const planA = a.investment_plans;
            const planB = b.investment_plans;
            return (planB?.min_amount || 0) - (planA?.min_amount || 0);
          });
          naturalPlan = sortedInvs[0]?.investment_plans || null;
        }

        // 2. Determine resolved current plan (override takes precedence)
        let resolvedPlan = naturalPlan;
        if (profile.current_plan_override_id) {
          const overridePlan = activePlans.find((p: any) => p.id === profile.current_plan_override_id);
          if (overridePlan) {
            resolvedPlan = overridePlan;
          }
        }

        // 3. Determine eligibility based ONLY on totalDeposited >= plan.min_amount
        let highestEligiblePlan: any = null;
        activePlans.forEach((plan: any) => {
          if (plan.is_active && totalDeposited >= plan.min_amount) {
            if (!highestEligiblePlan || plan.min_amount > highestEligiblePlan.min_amount) {
              highestEligiblePlan = plan;
            }
          }
        });

        // 4. Next Unlockable Plan
        const nextPlan = activePlans.find((plan: any) => plan.is_active && totalDeposited < plan.min_amount);

        return {
          ...profile,
          totalDeposited,
          currentPlan: resolvedPlan,
          highestEligiblePlan,
          nextPlan,
        };
      });

      setUsers(combined);
      setFilteredUsers(combined);
    } catch (error) {
      console.error('Error loading plans admin data:', error);
      toast.error('Failed to load users plans data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase()) ||
      user.id?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleOverridePlan = async (userId: string, planId: string) => {
    try {
      setUpdatingUserId(userId);
      const overrideVal = planId === 'auto' ? null : planId;

      const { error } = await supabase
        .from('profiles')
        .update({
          current_plan_override_id: overrideVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User plan override updated successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error overriding plan:', error);
      toast.error(error.message || 'Failed to update plan override');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getPlanBadgeClass = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('starter')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    if (name.includes('platinum')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    }
    if (name.includes('executive')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    }
    if (name.includes('apex')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">Users Investment Plans</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor users' active tiers, cumulative deposit amounts, and upgrade eligibility. Override plans manually if needed.
        </p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">All Users Plans ({filteredUsers.length})</CardTitle>
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <Input
                placeholder="Search user by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Cumulative Deposits</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Current Plan</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Highest Eligible Plan</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Upgrade Target</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6 w-[200px]">Manual Plan Override</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                          <Skeleton className="h-3 w-36 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4.5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4.5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs font-medium">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const nextUpgradeEligible = user.highestEligiblePlan && (!user.currentPlan || user.highestEligiblePlan.min_amount > user.currentPlan.min_amount);
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">{user.full_name || 'Unnamed'}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">
                          ${user.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {user.currentPlan ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPlanBadgeClass(user.currentPlan.name)}`}>
                              {user.currentPlan.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                              None
                            </span>
                          )}
                          {user.current_plan_override_id && (
                            <span className="ml-1 text-[9px] font-bold text-amber-500" title="Overridden by Admin">(Override)</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {user.highestEligiblePlan ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getPlanBadgeClass(user.highestEligiblePlan.name)}`}>
                              {user.highestEligiblePlan.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                              None (Min $200)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs px-6 py-4">
                          {nextUpgradeEligible ? (
                            <span className="text-[11px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                              Ready to upgrade
                            </span>
                          ) : user.nextPlan ? (
                            <div className="text-[10px] text-slate-500">
                              Needs <span className="font-semibold text-slate-700 dark:text-slate-300">${(user.nextPlan.min_amount - user.totalDeposited).toLocaleString()}</span> more for <span className="font-semibold">{user.nextPlan.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Max tier reached</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Select
                            value={user.current_plan_override_id || 'auto'}
                            onValueChange={(val) => handleOverridePlan(user.id, val)}
                            disabled={updatingUserId === user.id}
                          >
                            <SelectTrigger className="h-8.5 rounded-xl border-slate-200 dark:border-slate-800 text-[11px] bg-slate-50 dark:bg-slate-850">
                              <SelectValue placeholder="Select plan override" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                              <SelectItem value="auto">Automatic (Compute)</SelectItem>
                              {plans.map((p: any) => (
                                <SelectItem key={p.id} value={p.id} className="text-[11px]">{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPlans;
