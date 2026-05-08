import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { Check, X, Eye, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AdminDeposits = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<{ url: string; deposit: any } | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

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

  const handleViewProof = async (deposit: any) => {
    if (!deposit.proof_url) {
      toast.error('No proof image uploaded for this deposit');
      return;
    }

    setSelectedProof({ url: deposit.proof_url, deposit });
    setLoadingImage(true);

    try {
      const { data, error } = await supabase.storage
        .from('deposit-proofs')
        .createSignedUrl(deposit.proof_url, 3600);

      if (error) throw error;
      setProofImageUrl(data.signedUrl);
    } catch (error) {
      console.error('Error loading proof image:', error);
      setProofImageUrl(null);
      toast.error('Failed to load proof image');
    } finally {
      setLoadingImage(false);
    }
  };

  const closeProofModal = () => {
    setSelectedProof(null);
    setProofImageUrl(null);
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
                <TableHead>Proof</TableHead>
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
                    {deposit.proof_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1.5"
                        onClick={() => handleViewProof(deposit)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Proof
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        No proof
                      </span>
                    )}
                  </TableCell>
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

      {/* Proof Image Modal */}
      <Dialog open={!!selectedProof} onOpenChange={closeProofModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">User</p>
                  <p className="font-semibold">{selectedProof.deposit.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedProof.deposit.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Amount</p>
                  <p className="text-xl font-bold">${selectedProof.deposit.amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Status</p>
                  <Badge variant={
                    selectedProof.deposit.status === 'approved' ? 'default' :
                    selectedProof.deposit.status === 'pending' ? 'secondary' :
                    'destructive'
                  } className="mt-1">
                    {selectedProof.deposit.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Date</p>
                  <p className="font-medium">{formatDistanceToNow(new Date(selectedProof.deposit.created_at), { addSuffix: true })}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-muted/30">
                {loadingImage ? (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Loading image...</p>
                  </div>
                ) : proofImageUrl ? (
                  <img
                    src={proofImageUrl}
                    alt="Payment Proof"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <p>Unable to load image</p>
                  </div>
                )}
              </div>

              {selectedProof.deposit.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleApprove(selectedProof.deposit.id, selectedProof.deposit.user_id, selectedProof.deposit.amount);
                      closeProofModal();
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Deposit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleReject(selectedProof.deposit.id);
                      closeProofModal();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Deposit
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeposits;
