import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { countries } from '@/utils/countries';
import { TermsModal } from '@/components/TermsModal';
import { saveLoginActivity } from '@/utils/deviceDetection';
import { useTheme } from '@/contexts/ThemeContext';
import logo from '@/assets/logo.png';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    // Auto-fill referral code from URL
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Check if referral code is valid
      let referrerId = null;
      if (referralCode && referralCode.trim()) {
        const { data: referrers, error: referrerError } = await supabase
          .from('profiles')
          .select('user_id, referral_code')
          .ilike('referral_code', referralCode.trim())
          .limit(1);
        
        if (referrerError || !referrers || referrers.length === 0) {
          toast.error('Invalid referral code');
          setLoading(false);
          return;
        }
        
        referrerId = referrers[0].user_id;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone_number: phone,
            date_of_birth: dob,
            country: country,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional data
        await supabase.from('profiles').update({
          phone_number: phone,
          date_of_birth: dob,
          country: country,
        }).eq('user_id', data.user.id);

        // Create referral record if referrer exists
        if (referrerId) {
          await supabase.from('referrals').insert({
            referrer_id: referrerId,
            referred_id: data.user.id,
            bonus_amount: 0, // Will be updated on first deposit
            bonus_paid: false
          });
        }

        toast.success('Account created successfully! Please check your email to verify your account.');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
  ];

  return (
    <div className="font-body-md text-on-background selection:bg-secondary-container selection:text-white bg-background min-h-screen">
      {/* Top AppBar (Simplified for Transactional Page) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex justify-between items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5">
            <img src={logo} alt="Whitestones Markets" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-slate-900 font-display-lg tracking-tight">Whitestones Markets</span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative group flex items-center">
             <span className="material-symbols-outlined text-xl text-slate-600">language</span>
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent appearance-none text-slate-600 font-label-md text-label-md uppercase cursor-pointer outline-none ml-1"
             >
               {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.code}</option>
               ))}
             </select>
          </div>
          {/* Dark/Light Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-600 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-xl">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-md mx-auto min-h-screen">
        <div className="mb-8">
          <h1 className="text-headline-lg font-headline-lg text-primary mb-2">{t('auth.signup')}</h1>
          <p className="text-on-surface-variant text-body-md">Join Whitestones Markets today and experience institutional-grade wealth management.</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <div className="h-1 flex-1 bg-secondary rounded-full"></div>
          <div className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>
          <div className="h-1 flex-1 bg-surface-container-highest rounded-full"></div>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="fullName">{t('auth.fullName')} *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <input 
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-slate-300" 
                  placeholder="John Doe" 
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="email">{t('auth.email')} *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-slate-300" 
                  placeholder="john@example.com" 
                />
              </div>
            </div>

            {/* Dual Row for Password & Confirm */}
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="password">{t('auth.password')} *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-slate-300" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-secondary"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="confirmPassword">Confirm Password *</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary">
                    <span className="material-symbols-outlined">lock_reset</span>
                  </div>
                  <input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-slate-300" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-secondary"
                  >
                    <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive mt-1 px-1">Passwords do not match</p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="phone">{t('auth.phone')} *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary">
                  <span className="material-symbols-outlined">smartphone</span>
                </div>
                <input 
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-slate-300" 
                  placeholder="+1 (555) 000-0000" 
                />
              </div>
            </div>

            {/* Date of Birth & Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="dob">{t('auth.dob')} *</label>
                <input 
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-slate-600" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="country">{t('auth.country')} *</label>
                <select 
                  id="country"
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                  required
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.6rem_auto] pr-8"
                >
                  <option value="" disabled>Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div className="space-y-1.5">
              <label className="text-label-md font-label-md text-on-surface-variant ml-1" htmlFor="referralCode">Referral Code (Optional)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary">
                  <span className="material-symbols-outlined">redeem</span>
                </div>
                <input 
                  id="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-dashed border-slate-300 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-slate-400 font-data-mono uppercase" 
                  placeholder="EX: WS-9921" 
                />
              </div>
            </div>
          </div>

          {/* T&C Checkbox */}
          <div className="flex items-start gap-3 py-2">
            <div className="relative flex items-center mt-1">
              <input 
                id="terms" 
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
                className="peer h-5 w-5 rounded-md border-slate-300 text-secondary focus:ring-secondary/20 transition-all cursor-pointer" 
              />
            </div>
            <label className="text-sm text-on-surface-variant leading-relaxed cursor-pointer" htmlFor="terms">
              By continuing, I agree to the{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                className="text-secondary font-semibold underline underline-offset-2 hover:text-secondary/80"
              >
                Terms & Conditions
              </button>
            </label>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 mt-4 group disabled:opacity-70"
          >
            <span className="text-body-lg">{loading ? 'Creating Account...' : t('auth.signup')}</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-on-surface-variant">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-secondary font-bold ml-1 active:opacity-70 hover:underline">
              {t('auth.signInInstead')}
            </Link>
          </p>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 p-4 rounded-2xl bg-surface-container flex items-center gap-4 border border-white/50">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          </div>
          <div>
            <p className="text-[12px] font-bold text-secondary uppercase tracking-wider">Bank-Level Security</p>
            <p className="text-[13px] text-on-surface-variant">Your data is encrypted with 256-bit AES protection.</p>
          </div>
        </div>
      </main>

      <TermsModal open={showTermsModal} onOpenChange={setShowTermsModal} />

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-80 h-80 bg-tertiary-fixed-dim/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default Signup;
