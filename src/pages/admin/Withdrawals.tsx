import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {['User', 'Amount', 'Account', 'Status', 'Date', 'Actions'].map((header, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
        <p className="text-muted-foreground mt-2">Review and approve withdrawal requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{withdrawal.profiles?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{withdrawal.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${withdrawal.amount}</TableCell>
                  <TableCell>{withdrawal.withdrawal_accounts?.account_type || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      withdrawal.status === 'completed' ? 'default' :
                      withdrawal.status === 'pending' ? 'secondary' :
                      'destructive'
                    }>
                      {withdrawal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal.id, withdrawal.user_id, withdrawal.amount)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(withdrawal.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWithdrawals;
