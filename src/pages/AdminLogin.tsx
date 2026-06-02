import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;

      if (data.user) {
        const { data: isAdmin } = await supabase.rpc('has_role', { 
          _user_id: data.user.id, 
          _role: 'admin' 
        });

        if (isAdmin) {
          toast.success('Admin login successful!');
          navigate('/admin/dashboard', { replace: true });
        } else {
          await supabase.auth.signOut();
          toast.error('Unauthorized: Admin access required');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001736] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10 overflow-hidden border border-white/20 p-2">
            <img src={logo} alt="Whitestones Markets" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-blue-200/60 mt-2 text-sm">Whitestones Markets Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-200/70 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-300/40">mail</span>
                <input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-200/30 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 outline-none transition-all"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-200/70 uppercase tracking-widest ml-1" htmlFor="password">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-blue-300/40">lock</span>
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-blue-200/30 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-200 transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-1.5 justify-center py-0.5">
                  <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '-0.3s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '-0.15s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">shield</span>
                  Access Admin Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <Link to="/login" className="text-blue-300/50 text-sm hover:text-blue-200 transition-colors">
              ← Back to User Login
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-blue-200/20 text-xs">© 2024 Whitestones Markets. Institutional Grade Security.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
