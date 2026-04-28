import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy } from 'lucide-react';

const Referrals = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchReferrals();
    generateReferralCode();
  }, []);

  const generateReferralCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Get user's referral code from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .single();
    
    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
      setReferralLink(`${window.location.origin}/signup?ref=${profile.referral_code}`);
    }
  };

  const fetchReferrals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('referrals')
      .select('*, referred:profiles!referred_id(full_name, email)')
      .eq('referrer_id', user.id);

    setReferrals(data || []);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Hero Section */}
      <section>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Refer & Earn</h1>
        <p className="text-on-surface-variant font-body-md">Share the wealth with your network and earn a 10% bonus on their first deposit.</p>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white/70 backdrop-blur-md border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-on-surface-variant font-label-md text-sm mb-2">Total Referrals</span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline-md text-headline-md text-primary">{referrals.length}</span>
          </div>
        </div>
        <div className="bg-primary-container p-4 rounded-xl text-white border-none shadow-lg flex flex-col justify-between">
          <span className="text-on-primary-container font-label-md text-sm mb-2 opacity-90">Total Earnings</span>
          <span className="font-headline-md text-headline-md">
            ${referrals.reduce((sum, ref) => sum + (ref.bonus_amount || 0), 0).toFixed(2)}
          </span>
        </div>
      </section>

      {/* Referral Tools */}
      <section className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-headline-md text-headline-md text-primary mb-6">Your Invitation</h2>
        <div className="space-y-6">
          {/* Referral Code */}
          <div>
            <label className="block font-label-md text-on-surface-variant mb-2">Referral Code</label>
            <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <span className="font-data-mono text-data-mono text-primary tracking-widest uppercase">{referralCode}</span>
              <button onClick={() => copyToClipboard(referralCode, 'Referral code')} className="text-secondary-container active:scale-90 transition-all">
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>
          </div>
          {/* Referral Link */}
          <div>
            <label className="block font-label-md text-on-surface-variant mb-2">Unique Link</label>
            <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-xl p-4 overflow-hidden">
              <span className="font-label-md text-on-surface-variant truncate mr-4">{referralLink}</span>
              <button onClick={() => copyToClipboard(referralLink, 'Referral link')} className="text-secondary-container active:scale-90 transition-all flex-shrink-0">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section>
        <h2 className="font-headline-md text-headline-md text-primary mb-6">How It Works</h2>
        <div className="space-y-4 relative">
          <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-surface-container-highest"></div>
          {/* Step 1 */}
          <div className="flex gap-4 relative">
            <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center text-primary z-10 shrink-0">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div className="pt-2">
              <h3 className="font-headline-md text-lg text-primary">Invite a Friend</h3>
              <p className="text-on-surface-variant text-sm mt-1">Send your unique referral link or code to your network.</p>
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex gap-4 relative">
            <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center text-primary z-10 shrink-0">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div className="pt-2">
              <h3 className="font-headline-md text-lg text-primary">Friend Completes KYC</h3>
              <p className="text-on-surface-variant text-sm mt-1">Once they register and complete account verification.</p>
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex gap-4 relative">
            <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center text-white z-10 shrink-0">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="pt-2">
              <h3 className="font-headline-md text-lg text-primary">Earn 10% Reward</h3>
              <p className="text-on-surface-variant text-sm mt-1">Receive a 10% bonus instantly when they make their first deposit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Your Referrals List */}
      <section className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-sm mt-8">
        <h2 className="font-headline-md text-headline-md text-primary mb-4">Your Referrals</h2>
        {referrals.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No referrals yet. Share your link to start earning!
          </p>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral, index) => (
              <div key={referral.id} className={`flex justify-between items-center pb-4 ${index !== referrals.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div>
                  <p className="font-label-md text-on-surface">{referral.referred?.full_name}</p>
                  <p className="text-xs text-on-surface-variant truncate w-32 sm:w-auto">{referral.referred?.email}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-headline-md text-green-600">
                    ${(referral.bonus_amount || 0).toFixed(2)}
                  </p>
                  <p className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${referral.bonus_paid ? 'bg-green-100 text-green-700' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {referral.bonus_paid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Referrals;
