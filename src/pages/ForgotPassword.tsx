import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 z-50 flex justify-between items-center h-16 px-4 w-full shadow-sm">
        <Link to="/login" className="flex items-center gap-1 text-on-surface-variant hover:bg-slate-50 rounded-xl px-2 py-1 active:scale-95 transition-transform duration-200">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md">Back to Login</span>
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md mt-12">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-secondary/10 overflow-hidden border border-slate-100 p-2">
              <img src={logo} alt="Whitestones Markets" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-center tracking-tight px-4">Reset Password</h1>
            <p className="text-on-surface-variant font-body-md text-center mt-2 px-6 opacity-70">
              Enter your email and we'll send you a secure link to reset your password.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60">
            {!sent ? (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant ml-1 uppercase tracking-widest text-[10px]" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">mail</span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body-md" 
                      id="email" 
                      placeholder="name@example.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white font-headline-md rounded-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="flex items-center gap-1.5 justify-center py-0.5">
                      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '-0.3s' }}></span>
                      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '-0.15s' }}></span>
                      <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
                    </div>
                  ) : (
                    <>
                      Send Reset Link
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <Link to="/login" className="text-primary font-semibold text-sm hover:underline">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-primary mb-2">Email Sent!</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
                  </p>
                </div>
                <Link to="/login">
                  <button className="w-full py-4 bg-primary text-white font-headline-md rounded-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Back to Login
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[40%] bg-tertiary-fixed-dim/10 rounded-full blur-[100px]"></div>
      </div>

      <footer className="h-16 flex items-center justify-center px-6 mt-12 pb-6">
        <p className="text-[12px] font-label-md text-outline opacity-60">© 2024 Whitestones Markets. Institutional Grade Security.</p>
      </footer>
    </div>
  );
};

export default ForgotPassword;
