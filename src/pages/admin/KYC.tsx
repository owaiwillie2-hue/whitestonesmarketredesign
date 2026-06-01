import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';

interface KYCSubmission {
  user_id: string;
  user_name: string;
  user_email: string;
  user_country: string;
  user_phone: string;
  user_dob: string;
  user_address: string;
  user_city: string;
  user_state: string;
  status: string;
  submitted_at: string;
  documents: any[];
  latestDocId: string;
}

export const AdminKYC = () => {
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchKYCDocs();
  }, []);

  const fetchKYCDocs = async () => {
    try {
      const { data: kycData } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (!kycData) return;

      // Get unique user IDs
      const userIds = [...new Set(kycData.map((k: any) => k.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, country, phone, phone_number, date_of_birth, address, city, state')
        .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const profilesByUser: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesByUser[p.user_id] = p; });

      // Group documents by user
      const submissionsByUser: Record<string, any[]> = {};
      kycData.forEach((doc: any) => {
        if (!submissionsByUser[doc.user_id]) {
          submissionsByUser[doc.user_id] = [];
        }
        submissionsByUser[doc.user_id].push(doc);
      });

      // Create submission objects
      const submissions: KYCSubmission[] = Object.entries(submissionsByUser).map(([userId, docs]) => {
        const latestDoc = docs[0]; // Already sorted by submitted_at desc
        const profile = profilesByUser[userId] || {};
        return {
          user_id: userId,
          user_name: profile.full_name || 'Unknown',
          user_email: profile.email || '',
          user_country: profile.country || '',
          user_phone: profile.phone || profile.phone_number || '',
          user_dob: profile.date_of_birth || '',
          user_address: profile.address || '',
          user_city: profile.city || '',
          user_state: profile.state || '',
          status: latestDoc.status,
          submitted_at: latestDoc.submitted_at,
          documents: docs,
          latestDocId: latestDoc.id,
        };
      });

      setKycSubmissions(submissions);
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      toast.error('Failed to load KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setDocumentUrls({});
    setViewDialogOpen(true);

    // Load all document URLs
    const urls: Record<string, string> = {};
    for (const doc of submission.documents) {
      try {
        // Parse the document_url JSON string
        let documentPaths: any;
        try {
          documentPaths = JSON.parse(doc.document_url);
        } catch (e) {
          console.error('Error parsing document_url:', e);
          continue;
        }

        // Create signed URLs for each document part
        const docUrls: Record<string, string> = {};
        
        if (documentPaths.id_front) {
          const { data } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(documentPaths.id_front, 3600);
          if (data?.signedUrl) docUrls.id_front = data.signedUrl;
        }

        if (documentPaths.id_back) {
          const { data } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(documentPaths.id_back, 3600);
          if (data?.signedUrl) docUrls.id_back = data.signedUrl;
        }

        if (documentPaths.selfie) {
          const { data } = await supabase.storage
            .from('kyc-documents')
            .createSignedUrl(documentPaths.selfie, 3600);
          if (data?.signedUrl) docUrls.selfie = data.signedUrl;
        }

        urls[doc.id] = JSON.stringify(docUrls);
      } catch (error) {
        console.error(`Error loading document ${doc.id}:`, error);
      }
    }
    setDocumentUrls(urls);
  };

  const handleApprove = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin not authenticated');

      const response = await supabase.functions.invoke('approve-kyc', {
        body: {
          user_id: userId,
          approved_by: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve KYC');
      }

      toast.success('KYC approved successfully. Bonus credited if applicable.');
      setViewDialogOpen(false);
      fetchKYCDocs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve KYC');
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin not authenticated');

      const { error } = await supabase.functions.invoke('reject-kyc', {
        body: {
          user_id: userId,
          rejected_by: user.id,
          rejection_reason: reason,
        },
      });

      if (error) throw error;

      toast.success('KYC rejected');
      setViewDialogOpen(false);
      fetchKYCDocs();
    } catch (error: any) {
      console.error('Error rejecting KYC:', error);
      toast.error(error.message || 'Failed to reject KYC');
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">KYC Verification</h1>
        <p className="text-xs text-slate-500 mt-1">Review and verify user identity documents</p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">KYC Submissions ({kycSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : kycSubmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No KYC submissions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Documents</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Submitted</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycSubmissions.map((submission) => (
                    <TableRow key={submission.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{submission.user_name}</div>
                          <div className="text-[11px] text-slate-500">{submission.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">description</span>
                          <span>{submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          submission.status === 'approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            submission.status === 'approved' ? 'bg-green-500' :
                            submission.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></span>
                          {submission.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500 px-6 py-4">
                        {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleView(submission)}
                          className="h-8 px-3 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-white flex items-center gap-1 ml-auto"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 custom-scrollbar">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
              KYC Documents Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 p-5 rounded-2xl">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">User Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedSubmission.user_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email Address</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedSubmission.user_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Country</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedSubmission.user_country || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedSubmission.user_phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedSubmission.user_dob 
                        ? new Date(selectedSubmission.user_dob).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Age</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedSubmission.user_dob 
                        ? Math.floor((new Date().getTime() - new Date(selectedSubmission.user_dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">Home Address</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {[
                        selectedSubmission.user_address,
                        selectedSubmission.user_city,
                        selectedSubmission.user_state
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Status</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedSubmission.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : selectedSubmission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {selectedSubmission.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Submitted Documents</h3>
                <div className="grid gap-6">
                  {selectedSubmission.documents.map((doc) => {
                    let parsedUrls: any = {};
                    try {
                      parsedUrls = documentUrls[doc.id] ? JSON.parse(documentUrls[doc.id]) : {};
                    } catch (e) {
                      console.error('Error parsing document URLs:', e);
                    }

                    return (
                      <div key={doc.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h4 className="text-xs font-bold capitalize text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">badge</span>
                            {doc.document_type.replace(/_/g, ' ')}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            Submitted: {new Date(doc.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* ID Front */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-bold text-slate-400">Document Front</h5>
                            {parsedUrls.id_front ? (
                              <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 p-2">
                                <img 
                                  src={parsedUrls.id_front} 
                                  alt="ID Front"
                                  className="w-full h-auto rounded-lg shadow-sm max-h-[300px] object-contain mx-auto"
                                />
                              </div>
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-8 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-400">Loading front document...</span>
                              </div>
                            )}
                          </div>

                          {/* ID Back */}
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-bold text-slate-400">Document Back</h5>
                            {parsedUrls.id_back ? (
                              <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 p-2">
                                <img 
                                  src={parsedUrls.id_back} 
                                  alt="ID Back"
                                  className="w-full h-auto rounded-lg shadow-sm max-h-[300px] object-contain mx-auto"
                                />
                              </div>
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-8 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-400">Loading back document...</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selfie with ID */}
                        {parsedUrls.selfie && (
                          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                            <h5 className="text-[11px] font-bold text-slate-400 text-center">Selfie with Document</h5>
                            <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 p-2 max-w-md mx-auto">
                              <img 
                                src={parsedUrls.selfie} 
                                alt="Selfie with ID"
                                className="w-full h-auto rounded-lg shadow-sm max-h-[350px] object-contain mx-auto"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedSubmission.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    onClick={() => handleApprove(selectedSubmission.user_id)} 
                    className="flex-1 h-11 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Approve KYC
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleReject(selectedSubmission.user_id)} 
                    className="flex-1 h-11 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Reject KYC
                  </Button>
                </div>
              )}

              {selectedSubmission.status === 'rejected' && selectedSubmission.documents[0]?.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    Rejection Reason
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{selectedSubmission.documents[0].rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYC;

