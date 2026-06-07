import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';

type StatusFilter = 'all' | 'active' | 'restricted' | 'suspended';

export const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restrict' | 'unrestrict' | 'ban' | 'unban' | 'delete';
    user: any | null;
  }>({ open: false, type: 'restrict', user: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openMenuId]);

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const userIds = (profiles || []).map((p: any) => p.user_id);

      const [{ data: balances }, { data: kycDocs }] = await Promise.all([
        supabase
          .from('account_balances')
          .select('*')
          .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
          .from('kyc_documents')
          .select('user_id, status')
          .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
      ]);

      const balancesByUser: Record<string, any[]> = {};
      (balances || []).forEach((b: any) => {
        if (!balancesByUser[b.user_id]) balancesByUser[b.user_id] = [];
        balancesByUser[b.user_id].push(b);
      });

      const kycByUser: Record<string, any[]> = {};
      (kycDocs || []).forEach((k: any) => {
        if (!kycByUser[k.user_id]) kycByUser[k.user_id] = [];
        kycByUser[k.user_id].push({ status: k.status });
      });

      const combinedUsers = (profiles || []).map((p: any) => ({
        ...p,
        account_balances: balancesByUser[p.user_id] || [],
        kyc_documents: kycByUser[p.user_id] || [],
      }));

      setUsers(combinedUsers);
      applyFilters(combinedUsers, searchQuery, statusFilter);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (userList: any[], search: string, status: StatusFilter) => {
    let filtered = userList;

    if (search) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(user => {
        if (status === 'suspended') return user.is_suspended;
        if (status === 'restricted') return user.is_restricted && !user.is_suspended;
        if (status === 'active') return !user.is_suspended && !user.is_restricted;
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(users, query, statusFilter);
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    applyFilters(users, searchQuery, status);
  };

  const getUserStatus = (user: any): { label: string; color: string; dotColor: string } => {
    if (user.is_suspended) {
      return { label: 'Banned', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', dotColor: 'bg-red-500' };
    }
    if (user.is_restricted) {
      return { label: 'Restricted', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', dotColor: 'bg-amber-500' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', dotColor: 'bg-green-500' };
  };

  const getStatusCounts = () => {
    const all = users.length;
    const active = users.filter(u => !u.is_suspended && !u.is_restricted).length;
    const restricted = users.filter(u => u.is_restricted && !u.is_suspended).length;
    const suspended = users.filter(u => u.is_suspended).length;
    return { all, active, restricted, suspended };
  };

  const openConfirmDialog = (type: typeof confirmDialog.type, user: any) => {
    setConfirmDialog({ open: true, type, user });
    setActionReason('');
    setOpenMenuId(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.user) return;
    setActionLoading(true);

    const targetUser = confirmDialog.user;

    try {
      switch (confirmDialog.type) {
        case 'restrict': {
          const { error } = await supabase
            .from('profiles')
            .update({ is_restricted: true, updated_at: new Date().toISOString() } as any)
            .eq('id', targetUser.id);
          if (error) throw error;
          toast.success(`${targetUser.full_name || 'User'} account restricted`);
          break;
        }
        case 'unrestrict': {
          const { error } = await supabase
            .from('profiles')
            .update({ is_restricted: false, updated_at: new Date().toISOString() } as any)
            .eq('id', targetUser.id);
          if (error) throw error;
          toast.success(`${targetUser.full_name || 'User'} restrictions removed`);
          break;
        }
        case 'ban': {
          const { error } = await supabase
            .from('profiles')
            .update({ is_suspended: true, updated_at: new Date().toISOString() })
            .eq('id', targetUser.id);
          if (error) throw error;
          toast.success(`${targetUser.full_name || 'User'} account banned`);
          break;
        }
        case 'unban': {
          const { error } = await supabase
            .from('profiles')
            .update({ is_suspended: false, updated_at: new Date().toISOString() })
            .eq('id', targetUser.id);
          if (error) throw error;
          toast.success(`${targetUser.full_name || 'User'} account unbanned`);
          break;
        }
        case 'delete': {
          const userId = targetUser.user_id;

          // Delete all associated data — parallel batch where no FK deps
          await Promise.all([
            supabase.from('admin_notes').delete().eq('user_id', targetUser.id),
            supabase.from('notifications').delete().eq('user_id', userId),
            supabase.from('activity_logs').delete().eq('user_id', userId),
            supabase.from('redeemable_bonuses').delete().eq('user_id', userId),
            supabase.from('wallet_transfers').delete().eq('user_id', userId),
          ]);

          // Withdrawals depend on withdrawal_accounts FK
          await supabase.from('withdrawals').delete().eq('user_id', userId);
          await supabase.from('withdrawal_accounts').delete().eq('user_id', userId);

          // Delete remaining user data
          await Promise.all([
            supabase.from('transactions').delete().eq('user_id', userId),
            supabase.from('investments').delete().eq('user_id', userId),
            supabase.from('deposits').delete().eq('user_id', userId),
            supabase.from('kyc_documents').delete().eq('user_id', userId),
            supabase.from('account_balances').delete().eq('user_id', userId),
            supabase.from('referrals').delete().eq('referrer_id', userId),
            supabase.from('referrals').delete().eq('referred_id', userId),
          ]);

          // Delete profile last
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', targetUser.id);

          if (profileError) throw profileError;

          // Delete user role
          await supabase.from('user_roles').delete().eq('user_id', userId);

          toast.success(`${targetUser.full_name || 'User'} permanently deleted`);
          break;
        }
      }

      // Log admin action (skip for delete since the user record is gone)
      if (confirmDialog.type !== 'delete') {
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        if (adminUser) {
          await supabase.from('admin_notes').insert({
            user_id: targetUser.id,
            created_by: adminUser.id,
            note: `Admin action: ${confirmDialog.type.toUpperCase()} — ${actionReason || 'No reason provided'}`,
            metadata: {
              action: confirmDialog.type,
              reason: actionReason || undefined,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      setConfirmDialog({ open: false, type: 'restrict', user: null });
      await fetchUsers();
    } catch (error: any) {
      console.error(`Error performing ${confirmDialog.type}:`, error);
      toast.error(error.message || `Failed to ${confirmDialog.type} account`);
    } finally {
      setActionLoading(false);
    }
  };

  const getDialogConfig = () => {
    const { type, user } = confirmDialog;
    const name = user?.full_name || 'this user';

    switch (type) {
      case 'restrict':
        return {
          title: 'Restrict Account',
          description: `Restricting ${name}'s account will block them from creating investments, making deposits, and withdrawing funds. They can still log in and view their dashboard.`,
          icon: 'block',
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          buttonText: 'Restrict Account',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'unrestrict':
        return {
          title: 'Remove Restrictions',
          description: `This will restore ${name}'s full access. They will be able to create investments, deposits, and withdrawals again.`,
          icon: 'lock_open',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          buttonText: 'Remove Restrictions',
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'ban':
        return {
          title: 'Ban / Suspend Account',
          description: `Banning ${name} will completely block them from accessing the platform. They will see a suspension notice when trying to log in.`,
          icon: 'gavel',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonText: 'Ban Account',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'unban':
        return {
          title: 'Unban / Unsuspend Account',
          description: `This will restore ${name}'s access to the platform. They will be able to log in and use all features again.`,
          icon: 'lock_open',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          buttonText: 'Unban Account',
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'delete':
        return {
          title: 'Permanently Delete Account',
          description: `This will permanently delete ${name}'s account and ALL associated data including transactions, investments, deposits, withdrawals, KYC documents, and balances. This action CANNOT be undone.`,
          icon: 'delete_forever',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonText: 'Delete Permanently',
          buttonClass: 'bg-red-700 hover:bg-red-800 text-white',
        };
    }
  };

  const counts = getStatusCounts();
  const dialogConfig = getDialogConfig();

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'restricted', label: 'Restricted', count: counts.restricted },
    { key: 'suspended', label: 'Banned', count: counts.suspended },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">User Management</h1>
          <p className="text-xs text-slate-500 mt-1">View and manage all registered platform users</p>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">All Users ({filteredUsers.length})</CardTitle>
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {statusTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleStatusFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    statusFilter === tab.key
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                    statusFilter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Email</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Main Wallet</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Investment Wallet</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">KYC Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Joined</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><Skeleton className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-xs font-medium">
                      No users found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const status = getUserStatus(user);
                    return (
                      <TableRow
                        key={user.id}
                        className="border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <TableCell
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="font-bold text-xs text-slate-900 dark:text-white px-6 py-4 cursor-pointer hover:text-primary transition-colors"
                        >
                          {user.full_name || 'Unnamed'}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-xs text-slate-600 dark:text-slate-400 px-6 py-4 cursor-pointer"
                        >
                          {user.email}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">
                          ${parseFloat(user.account_balances?.[0]?.main_balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">
                          ${parseFloat(user.account_balances?.[0]?.investment_balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {user.kyc_documents?.[0]?.status ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.kyc_documents[0].status === 'approved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : user.kyc_documents[0].status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {user.kyc_documents[0].status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Not Submitted
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] text-slate-500 px-6 py-4">
                          {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : '-'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === user.id ? null : user.id);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <span className="material-symbols-outlined text-slate-400 text-[20px]">more_vert</span>
                            </button>

                            {openMenuId === user.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => { navigate(`/admin/users/${user.id}`); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                                  View Details
                                </button>

                                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                                {user.is_restricted ? (
                                  <button
                                    onClick={() => openConfirmDialog('unrestrict', user)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                    Remove Restrictions
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openConfirmDialog('restrict', user)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">block</span>
                                    Restrict Account
                                  </button>
                                )}

                                {user.is_suspended ? (
                                  <button
                                    onClick={() => openConfirmDialog('unban', user)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                    Unban Account
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openConfirmDialog('ban', user)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                                    Ban / Suspend
                                  </button>
                                )}

                                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                                <button
                                  onClick={() => openConfirmDialog('delete', user)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                                  Delete Permanently
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !actionLoading && setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {dialogConfig && (
                <>
                  <div className={`w-10 h-10 rounded-xl ${dialogConfig.iconBg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-[20px] ${dialogConfig.iconColor}`}>{dialogConfig.icon}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{dialogConfig.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {confirmDialog.user && (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {(confirmDialog.user.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{confirmDialog.user.full_name || 'Unnamed User'}</p>
                  <p className="text-[11px] text-slate-500">{confirmDialog.user.email}</p>
                </div>
              </div>
            )}

            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              confirmDialog.type === 'delete' || confirmDialog.type === 'ban'
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
                : confirmDialog.type === 'restrict'
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300'
            }`}>
              {dialogConfig?.description}
            </div>

            {confirmDialog.type === 'delete' && (
              <div className="flex items-start gap-2.5 p-3 bg-red-100 dark:bg-red-900/30 rounded-xl border border-red-300 dark:border-red-800">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[18px] mt-0.5">warning</span>
                <p className="text-[11px] font-bold text-red-700 dark:text-red-300">
                  This is a destructive and irreversible action. All user data will be permanently removed from the database.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason {confirmDialog.type !== 'unrestrict' && confirmDialog.type !== 'unban' ? '(required)' : '(optional)'}
              </label>
              <Textarea
                placeholder={`Why are you ${
                  confirmDialog.type === 'restrict' ? 'restricting' :
                  confirmDialog.type === 'unrestrict' ? 'unrestricting' :
                  confirmDialog.type === 'ban' ? 'banning' :
                  confirmDialog.type === 'unban' ? 'unbanning' :
                  'deleting'
                } this account?`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={2}
                className="rounded-xl border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                disabled={actionLoading}
                className="flex-1 rounded-xl h-10 text-xs font-bold border-slate-200 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={
                  actionLoading ||
                  ((confirmDialog.type === 'restrict' || confirmDialog.type === 'ban' || confirmDialog.type === 'delete') && !actionReason.trim())
                }
                className={`flex-1 rounded-xl h-10 text-xs font-bold ${dialogConfig?.buttonClass}`}
              >
                {actionLoading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] mr-1.5">{dialogConfig?.icon}</span>
                    {dialogConfig?.buttonText}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
