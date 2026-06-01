import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';

export const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      const userIds = (withdrawalsData || []).map((w: any) => w.user_id);
      const accountIds = (withdrawalsData || []).map((w: any) => w.account_id).filter(Boolean);

      const [{ data: profiles }, { data: accounts }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
        supabase
          .from('withdrawal_accounts')
          .select('*')
          .in('id', accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']),
      ]);

      const profilesByUser: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesByUser[p.user_id] = p; });

      const accountsById: Record<string, any> = {};
      (accounts || []).forEach((a: any) => { accountsById[a.id] = a; });

      const enriched = (withdrawalsData || []).map((w: any) => ({
        ...w,
        profiles: profilesByUser[w.user_id],
        withdrawal_accounts: w.account_id ? accountsById[w.account_id] : null,
      }));

      setWithdrawals(enriched);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string, userId: string, amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase.functions.invoke('approve-withdrawal', {
        body: {
          withdrawal_id: withdrawalId,
          approved_by: user.id,
        },
      });

      if (error) throw error;

      toast.success('Withdrawal approved successfully');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async (withdrawalId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const { data, error } = await supabase.functions.invoke('reject-withdrawal', {
        body: {
          withdrawal_id: withdrawalId,
          rejection_reason: reason,
        },
      });

      if (error) throw error;

      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">Withdrawals Management</h1>
        <p className="text-xs text-slate-500 mt-1">Review and approve user balance payout requests</p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">All Withdrawals ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No withdrawal requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Amount</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Account Details</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => {
                    const acctDetails = withdrawal.withdrawal_accounts?.account_details;
                    return (
                      <TableRow key={withdrawal.id} className="border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="px-6 py-4">
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">{withdrawal.profiles?.full_name || 'Unnamed'}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{withdrawal.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">${parseFloat(withdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400 px-6 py-4">
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{withdrawal.withdrawal_accounts?.account_type || 'N/A'}</span>
                            {acctDetails && (
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-normal max-w-xs overflow-hidden text-ellipsis">
                                {acctDetails.address || acctDetails.iban || acctDetails.number || JSON.stringify(acctDetails)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            withdrawal.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : withdrawal.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-[11px] text-slate-500 px-6 py-4">
                          {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-8 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-primary/90"
                                onClick={() => handleApprove(withdrawal.id, withdrawal.user_id, withdrawal.amount)}
                              >
                                <span className="material-symbols-outlined text-[15px] mr-1">check</span>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleReject(withdrawal.id)}
                              >
                                <span className="material-symbols-outlined text-[15px] mr-1">close</span>
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWithdrawals;
