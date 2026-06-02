import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isSuspended } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-1.5 justify-center py-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.3s' }}></span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.15s' }}></span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"></span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isSuspended && !isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white font-['Plus_Jakarta_Sans'] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="max-w-md w-full bg-slate-900/60 border border-white/10 backdrop-blur-xl p-8 rounded-3xl text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
            <span className="material-symbols-outlined text-[32px]">gavel</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Account Suspended</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your account has been temporarily suspended due to a violation of our terms of service or regulatory guidelines.
            </p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-left text-xs text-slate-400 leading-relaxed">
            Please contact our compliance team at <a href="mailto:compliance@whitestonesmarkets.com" className="text-red-400 font-bold hover:underline">compliance@whitestonesmarkets.com</a> to review your status and initiate an appeal.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = 'mailto:compliance@whitestonesmarkets.com'}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/25 active:scale-95"
            >
              Contact Compliance
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
