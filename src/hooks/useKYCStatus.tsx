import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface KYCStatus {
  id: string;
  user_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export const useKYCStatus = () => {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KYCStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKYCStatus = async () => {
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      setInitialLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      setKyc(data as KYCStatus || null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setKyc(null);
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    fetchKYCStatus();

    // Subscribe to changes for this specific user
    const channel = supabase
      .channel(`kyc-changes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kyc_documents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setKyc(payload.new as KYCStatus);
          } else {
            setKyc(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isApproved = kyc?.status === 'approved';
  const isPending = kyc?.status === 'pending';
  const isUnderReview = kyc?.status === 'under_review';
  const isRejected = kyc?.status === 'rejected';

  return {
    kyc,
    loading,
    initialLoading,
    error: error || '',
    isApproved,
    isPending,
    isUnderReview,
    isRejected,
    rejectionReason: kyc?.rejection_reason,
    refreshKYC: fetchKYCStatus,
  };
};
