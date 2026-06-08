import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
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

      const response = await supabase.functions.invoke('approve-deposit', {
        body: {
          deposit_id: depositId,
          approved_by: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve deposit');
      }

      // Insert notification
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Deposit Approved',
        message: `Your deposit of $${amount.toFixed(2)} has been successfully reviewed and approved. The funds have been credited to your main wallet balance.`,
        type: 'payment_updates',
        is_global: false
      });

      toast.success(`Deposit approved! $${amount.toFixed(2)} credited to main wallet.`);
      fetchDeposits();
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      toast.error(error.message || 'Failed to approve deposit');
    }
  };

  const handleReject = async (depositId: string) => {
    try {
      const response = await supabase.functions.invoke('reject-deposit', {
        body: {
          deposit_id: depositId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to reject deposit');
      }

      // Insert notification
      const depositObj = deposits.find(d => d.id === depositId);
      if (depositObj) {
        await supabase.from('notifications').insert({
          user_id: depositObj.user_id,
          title: 'Deposit Rejected',
          message: `Your deposit of $${parseFloat(depositObj.amount).toFixed(2)} was not approved by our compliance team. Please ensure your payment proof is valid and submit again.`,
          type: 'payment_updates',
          is_global: false
        });
      }

      toast.success('Deposit request rejected');
      fetchDeposits();
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      toast.error(error.message || 'Failed to reject deposit');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Plus_Jakarta_Sans']">Deposits Management</h1>
        <p className="text-xs text-slate-500 mt-1">Review and approve user deposit requests and payment proofs</p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">All Deposit Requests ({deposits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Method</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Proof</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                          <div className="h-3 w-32 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 text-xs font-medium">
                      No deposit transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  deposits.map((deposit) => (
                    <TableRow key={deposit.id} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{deposit.profiles?.full_name || 'Unnamed'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{deposit.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-white px-6 py-4">${parseFloat(deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 px-6 py-4">{deposit.payment_method}</TableCell>
                      <TableCell className="px-6 py-4">
                        {deposit.proof_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5 h-8 text-[11px] rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                            onClick={() => handleViewProof(deposit)}
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            View Proof
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">no_photography</span>
                            No proof
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          deposit.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : deposit.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {deposit.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500 px-6 py-4">
                        {formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {deposit.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 rounded-lg text-[11px] font-bold bg-primary text-white hover:bg-primary/90"
                              onClick={() => handleApprove(deposit.id, deposit.user_id, deposit.amount)}
                            >
                              <span className="material-symbols-outlined text-[15px] mr-1">check</span>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleReject(deposit.id)}
                            >
                              <span className="material-symbols-outlined text-[15px] mr-1">close</span>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Proof Image Modal */}
      <Dialog open={!!selectedProof} onOpenChange={closeProofModal}>
        <DialogContent className="max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-6 gap-0">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">Payment Proof</DialogTitle>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User</p>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedProof.deposit.profiles?.full_name || 'Unnamed'}</p>
                  <p className="text-slate-500">{selectedProof.deposit.profiles?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">${parseFloat(selectedProof.deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                  <div className="pt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedProof.deposit.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : selectedProof.deposit.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {selectedProof.deposit.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">
                    {formatDistanceToNow(new Date(selectedProof.deposit.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-2">
                {loadingImage ? (
                  <div className="flex flex-col items-center justify-center h-96 gap-2">
                    <span className="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
                    <p className="text-xs text-slate-500 font-medium">Loading proof image...</p>
                  </div>
                ) : proofImageUrl ? (
                  <img
                    src={proofImageUrl}
                    alt="Payment Proof"
                    className="w-full h-auto max-h-[500px] object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-slate-500 gap-2">
                    <span className="material-symbols-outlined text-[32px]">broken_image</span>
                    <p className="text-xs font-semibold">Unable to load image</p>
                  </div>
                )}
              </div>

              {selectedProof.deposit.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 rounded-xl h-11 text-xs font-bold bg-primary text-white"
                    onClick={() => {
                      handleApprove(selectedProof.deposit.id, selectedProof.deposit.user_id, selectedProof.deposit.amount);
                      closeProofModal();
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1.5">check</span>
                    Approve Deposit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl h-11 text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      handleReject(selectedProof.deposit.id);
                      closeProofModal();
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1.5">close</span>
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
