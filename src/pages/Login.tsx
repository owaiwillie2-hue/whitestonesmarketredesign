import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast as sonnerToast } from 'sonner';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import * as OTPAuth from 'otpauth';
import { saveLoginActivity } from '@/utils/deviceDetection';
import { useTheme } from '@/contexts/ThemeContext';
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);

  // Redirect already-authenticated users to dashboard only if credentials were entered
  useEffect(() => {
    if (!authLoading && user && email && password) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate, email, password]);

  // On mount, clear any stale sessions that might interfere with fresh login
  useEffect(() => {
    const clearStaleSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if token is expired
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt && expiresAt < now) {
            console.log('[Login] Clearing expired session from storage');
            await supabase.auth.signOut();
          }
        }
      } catch (e) {
        console.error('[Login] Error checking session:', e);
      }
    };
    clearStaleSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any existing stale session before attempting login
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check 2FA (fast query)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('two_factor_enabled, two_factor_secret')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('[Login] Profile fetch error:', profileError);
        }

        if (profile?.two_factor_enabled && profile?.two_factor_secret) {
          // Require 2FA verification
          setPendingUserId(data.user.id);
          setTwoFactorSecret(profile.two_factor_secret);
          setShow2FADialog(true);
          setLoading(false);
          // Sign out temporarily until 2FA is verified
          await supabase.auth.signOut();
        } else {
          // No 2FA - go directly to dashboard
          completeLogin(data.user.id);
        }
      }
    } catch (error: any) {
      console.error('[Login] Error:', error);
      setLoading(false);
      if (error.message?.includes('Email not confirmed')) {
        navigate('/email-confirmation', { state: { email } });
      } else if (error.message?.includes('Invalid login credentials')) {
        // Use sonner directly to avoid the blocking modal
        sonnerToast.error('Invalid email or password. Please try again.');
      } else {
        sonnerToast.error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleVerify2FA = async () => {
    if (!pendingUserId || !twoFactorSecret) return;

    if (twoFactorCode.length !== 6) {
      sonnerToast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'Whitestones Markets',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: twoFactorSecret,
      });

      const isValid = totp.validate({ token: twoFactorCode, window: 1 }) !== null;

      if (!isValid) {
        sonnerToast.error('Invalid verification code. Please try again.');
        setTwoFactorCode('');
        setLoading(false);
        return;
      }

      // Re-authenticate since we signed out for 2FA
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        setShow2FADialog(false);
        setTwoFactorCode('');
        setPendingUserId(null);
        setTwoFactorSecret(null);
        completeLogin(data.user.id);
      }
    } catch (error: any) {
      console.error('[Login] 2FA error:', error);
      setLoading(false);
      sonnerToast.error(error.message || '2FA verification failed');
    }
  };

  const completeLogin = (userId: string) => {
    // Navigate first - use sonner directly (not the modal wrapper) for non-blocking toast
    navigate('/dashboard', { replace: true });
    sonnerToast.success('Login successful!');
    // Log activity in background (non-blocking)
    saveLoginActivity(userId).catch(console.error);
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
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 docked full-width top-0 z-50 flex justify-between items-center h-16 px-4 w-full shadow-sm">
        <Link to="/" className="flex items-center gap-1 text-on-surface-variant hover:bg-slate-50 rounded-xl px-2 py-1 active:scale-95 transition-transform duration-200">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md">Home</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative group flex items-center">
             <span className="material-symbols-outlined text-[20px] text-on-surface-variant">language</span>
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent appearance-none flex items-center gap-1 text-on-surface-variant hover:bg-slate-50 rounded-xl px-2 py-1 active:scale-95 transition-transform duration-200 font-label-md text-label-md cursor-pointer outline-none uppercase"
             >
               {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.code}</option>
               ))}
             </select>
          </div>
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-on-surface-variant hover:bg-slate-50 active:scale-90 transition-all duration-150"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md mt-12">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-secondary/10 overflow-hidden border border-slate-100 p-2">
              <img src={logo} alt="Whitestones Markets" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-center tracking-tight px-4">{t('auth.login')}</h1>
            <p className="text-on-surface-variant font-body-md text-center mt-2 px-6 opacity-70">Access your portfolio and manage your digital assets with institutional security.</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant ml-1 uppercase tracking-widest text-[10px]" htmlFor="email">{t('auth.email')}</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">mail</span>
                  <input 
                     className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none font-body-md" 
                     id="email" 
                     placeholder="name@example.com" 
                     type="email"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-[10px]" htmlFor="password">{t('auth.password')}</label>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">lock</span>
                  <input 
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none font-body-md" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      className="peer h-5 w-5 border-2 border-outline-variant rounded-md checked:bg-secondary checked:border-secondary transition-all cursor-pointer appearance-none" 
                      type="checkbox"
                      checked={rememberMe as any}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="absolute opacity-0 peer-checked:opacity-100 material-symbols-outlined text-white text-[16px] pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">check</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">{t('auth.rememberMe')}</span>
                </label>
                <Link className="font-label-md text-label-md text-secondary hover:underline" to="/forgot-password">{t('auth.forgotCode')}</Link>
              </div>

              {/* Action Button */}
              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-4 bg-primary text-white font-headline-md rounded-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                    {t('cta.login')}
                    <span className="material-symbols-outlined text-[20px]">login</span>
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-on-surface-variant font-body-md">
                 {t('auth.noAccount')} <Link className="text-secondary font-semibold hover:underline" to="/signup">{t('auth.createAccount')}</Link>
              </p>
            </div>
          </div>

          {/* Language Quick Switcher */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 px-4">
            {languages.map((lang) => (
               <button 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`text-xs font-label-md hover:text-secondary uppercase tracking-tighter ${language === lang.code ? 'text-secondary font-bold' : 'text-outline'}`}
               >
                 {lang.name}
               </button>
            ))}
          </div>
        </div>
      </main>

      {/* Visual Background Element */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[50%] bg-secondary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[40%] bg-tertiary-fixed-dim/10 rounded-full blur-[100px]"></div>
      </div>
      <footer className="h-16 flex items-center justify-center px-6 mt-12 pb-6">
        <p className="text-[12px] font-label-md text-outline opacity-60">© 2024 Whitestones Markets. Institutional Grade Security.</p>
      </footer>

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-md bg-surface border-slate-200 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-sm text-on-surface-variant">
              Enter the 6-digit verification code from your authenticator app.
            </p>
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode" className="text-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">Verification Code</Label>
              <Input
                id="twoFactorCode"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest bg-surface-container-low border-outline-variant py-6 rounded-xl focus:ring-secondary/20"
              />
            </div>
            <button 
              onClick={handleVerify2FA}
              className="w-full py-4 bg-primary text-white font-headline-md rounded-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              disabled={twoFactorCode.length !== 6 || loading}
            >
              Verify
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
