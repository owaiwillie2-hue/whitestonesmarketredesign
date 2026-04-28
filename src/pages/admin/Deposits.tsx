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

export const AdminDeposits = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false });

      const userIds = (depositsData || []).map((d: any) => d.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const profilesByUser: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesByUser[p.user_id] = p; });

      const enriched = (depositsData || []).map((d: any) => ({
        ...d,
        profiles: profilesByUser[d.user_id],
      }));

      setDeposits(enriched);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (depositId: string, userId: string, amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin not authenticated');

      // Call the approve-deposit edge function (handles referral bonus logic)
      const { data: session } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('approve-deposit', {
        body: {
          deposit_id: depositId,
          approved_by: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve deposit');
      }

      const result = response.data;

      toast.success(
        result.bonus > 0
          ? `Deposit approved! $${result.amount_credited.toFixed(2)} credited (includes $${result.bonus.toFixed(2)} first-deposit bonus)`
          : `Deposit approved! $${result.amount_credited.toFixed(2)} credited`
      );
      fetchDeposits();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (depositId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('deposits').update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
        rejection_reason: 'Invalid proof of payment'
      }).eq('id', depositId);

      toast.success('Deposit rejected');
      fetchDeposits();
    } catch (error: any) {
      toast.error(error.message);
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
                  {['User', 'Amount', 'Method', 'Status', 'Date', 'Actions'].map((header, i) => (
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
        <h1 className="text-3xl font-bold">Deposit Management</h1>
        <p className="text-muted-foreground mt-2">Review and approve deposit requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deposits ({deposits.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{deposit.profiles?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{deposit.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${deposit.amount}</TableCell>
                  <TableCell>{deposit.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant={
                      deposit.status === 'approved' ? 'default' :
                      deposit.status === 'pending' ? 'secondary' :
                      'destructive'
                    }>
                      {deposit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {deposit.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(deposit.id, deposit.user_id, deposit.amount)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(deposit.id)}
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

export default AdminDeposits;
