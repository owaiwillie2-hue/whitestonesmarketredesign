import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';
import bitcoinQR from '@/assets/bitcoin-qr.png';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { KYCGuard, KYCStatusBadge } from '@/components/KYCGuard';
import { Skeleton } from '@/components/ui/skeleton';

const Deposit = () => {
  const { isApproved, isPending, isRejected, rejectionReason, initialLoading: kycLoading } = useKYCStatus();
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string>(bitcoinQR);
  const [bitcoinAddress, setBitcoinAddress] = useState('bc1q9s4hsv0m3mq7pu0gfj33l3ey800fe6ujy95apc');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('website_settings')
        .select('*');

      if (data) {
        const settingsObj: any = {};
        data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        
        if (settingsObj.deposit_qr_url) {
          setQrImageUrl(settingsObj.deposit_qr_url);
        }
        if (settingsObj.deposit_address) {
          setBitcoinAddress(settingsObj.deposit_address);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  if (kycLoading || settingsLoading) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let proofUrl = '';
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('deposit-proofs')
          .upload(fileName, proofFile);

        if (uploadError) throw uploadError;
        proofUrl = fileName;
      }

      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        amount: parseFloat(amount),
        payment_method: 'Bitcoin',
        proof_url: proofUrl,
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: 'Deposit Request Submitted',
        description: 'Your deposit is pending admin approval.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Title & History Link */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary">Deposit Funds</h2>
          <p className="font-body-md text-on-surface-variant">Top up your investment balance</p>
        </div>
        <button onClick={() => navigate('/dashboard/transactions?tab=deposits')} className="font-label-md text-secondary-container font-semibold flex items-center gap-1 mb-1">
          View History
          <span className="material-symbols-outlined text-[18px]">history</span>
        </button>
      </div>

      <KYCGuard
        isApproved={isApproved}
        isPending={isPending}
        isRejected={isRejected}
        rejectionReason={rejectionReason || ''}
        actionName="Deposit"
        isLoading={kycLoading}
      >
        {/* Bitcoin Instructions Card */}
        <div className="glass-card border border-outline-variant rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary-container">currency_bitcoin</span>
            <h2 className="font-headline-md text-headline-md">Bitcoin Deposit</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl mb-6 border border-slate-100">
            <div className="w-48 h-48 bg-slate-50 flex items-center justify-center rounded-lg mb-2 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#011d31 2px, transparent 2px)', backgroundSize: '10px 10px' }}></div>
              {settingsLoading ? (
                <Skeleton className="w-32 h-32 relative z-10" />
              ) : (
                <img src={qrImageUrl} alt="Bitcoin QR Code" className="w-32 h-32 relative z-10" />
              )}
            </div>
            <p className="text-[12px] font-label-md text-outline">Scan to copy address</p>
          </div>
          
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant block">Deposit Address</label>
            <div className="flex items-center gap-2 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
              <code className="font-data-mono text-sm truncate flex-1 text-on-surface">
                {settingsLoading ? <Skeleton className="h-4 w-full" /> : bitcoinAddress}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(bitcoinAddress);
                  toast({ title: "Address copied to clipboard" });
                }} 
                className="text-secondary-container active:scale-90 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
            </div>
            <p className="text-[11px] text-error font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Send only BTC to this address.
            </p>
          </div>
        </div>

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant ml-1">Deposit Amount (USD)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="font-headline-md text-on-surface-variant group-focus-within:text-secondary-container transition-colors">$</span>
              </div>
              <input 
                className="w-full bg-white border-2 border-outline-variant rounded-2xl py-4 pl-10 pr-4 font-headline-md focus:border-secondary-container focus:ring-0 transition-all placeholder:text-outline-variant" 
                placeholder="0.00" 
                type="number" 
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* Upload Proof */}
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant ml-1">Upload Transaction Proof</label>
            <div className="relative border-2 border-dashed border-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-white/50 hover:bg-white transition-colors cursor-pointer group">
              <span className="material-symbols-outlined text-secondary-container text-4xl group-hover:scale-110 transition-transform">
                {proofFile ? "check_circle" : "cloud_upload"}
              </span>
              <p className="font-label-md text-on-surface">{proofFile ? proofFile.name : "Click to upload screenshot"}</p>
              <p className="text-[12px] text-outline">JPG, PNG or PDF (max 5MB)</p>
              <input 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-full font-headline-md shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Submitting...' : 'Complete Deposit'}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          
          {/* Support Note */}
          <p className="text-center text-[12px] text-outline font-label-md px-6 leading-relaxed pb-4">
            Deposits are typically processed within 30-60 minutes after network confirmation. Need help? 
            <a href="#" className="text-secondary-container font-bold ml-1">Contact Support</a>
          </p>
        </form>
      </KYCGuard>
    </>
  );
};

export default Deposit;
