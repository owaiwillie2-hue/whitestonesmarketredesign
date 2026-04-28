import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
      // Fast authentication
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;

      if (data.user) {
        // Check admin role (fast RPC call)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Portal</h1>
            <p className="text-slate-600">Whitestones Markets</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-slate-900">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-900">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
