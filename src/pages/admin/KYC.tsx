import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Eye, FileText } from 'lucide-react';
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
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground mt-2">Review and verify user identity documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KYC Submissions ({kycSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kycSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No KYC submissions yet
                  </TableCell>
                </TableRow>
              ) : (
                kycSubmissions.map((submission) => (
                  <TableRow key={submission.user_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.user_name}</div>
                        <div className="text-sm text-muted-foreground">{submission.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <FileText className="h-4 w-4" />
                        {submission.documents.length} document{submission.documents.length !== 1 ? 's' : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        submission.status === 'approved' ? 'default' :
                        submission.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleView(submission)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Documents Review</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedSubmission.user_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedSubmission.user_email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Country:</span>
                    <p className="font-medium">{selectedSubmission.user_country || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{selectedSubmission.user_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <p className="font-medium">
                      {selectedSubmission.user_dob 
                        ? new Date(selectedSubmission.user_dob).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <p className="font-medium">
                      {selectedSubmission.user_dob 
                        ? Math.floor((new Date().getTime() - new Date(selectedSubmission.user_dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">
                      {[
                        selectedSubmission.user_address,
                        selectedSubmission.user_city,
                        selectedSubmission.user_state
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge variant={
                        selectedSubmission.status === 'approved' ? 'default' :
                        selectedSubmission.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {selectedSubmission.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(selectedSubmission.submitted_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>

                <div className="space-y-4">
                <h3 className="font-semibold">Submitted Documents</h3>
                <div className="grid gap-6">
                  {selectedSubmission.documents.map((doc) => {
                    let parsedUrls: any = {};
                    try {
                      parsedUrls = documentUrls[doc.id] ? JSON.parse(documentUrls[doc.id]) : {};
                    } catch (e) {
                      console.error('Error parsing document URLs:', e);
                    }

                    return (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</h4>
                          <Badge variant="outline" className="text-xs">
                            {new Date(doc.submitted_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* ID Front */}
                          {parsedUrls.id_front ? (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-muted-foreground">Document Front</h5>
                              <div className="bg-muted/30 rounded-lg overflow-hidden border">
                                <img 
                                  src={parsedUrls.id_front} 
                                  alt="ID Front"
                                  className="w-full h-auto"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-lg p-8 flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Loading...</p>
                            </div>
                          )}

                          {/* ID Back */}
                          {parsedUrls.id_back ? (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-muted-foreground">Document Back</h5>
                              <div className="bg-muted/30 rounded-lg overflow-hidden border">
                                <img 
                                  src={parsedUrls.id_back} 
                                  alt="ID Back"
                                  className="w-full h-auto"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-lg p-8 flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Loading...</p>
                            </div>
                          )}
                        </div>

                        {/* Selfie with ID */}
                        {parsedUrls.selfie && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">Selfie with ID</h5>
                            <div className="bg-muted/30 rounded-lg overflow-hidden border max-w-md mx-auto">
                              <img 
                                src={parsedUrls.selfie} 
                                alt="Selfie with ID"
                                className="w-full h-auto"
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
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleApprove(selectedSubmission.user_id)} 
                    className="flex-1"
                    size="lg"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Approve KYC
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleReject(selectedSubmission.user_id)} 
                    className="flex-1"
                    size="lg"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Reject KYC
                  </Button>
                </div>
              )}

              {selectedSubmission.status === 'rejected' && selectedSubmission.documents[0]?.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-medium text-destructive mb-2">Rejection Reason</h4>
                  <p className="text-sm">{selectedSubmission.documents[0].rejection_reason}</p>
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
