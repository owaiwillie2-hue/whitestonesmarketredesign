import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsAuthenticated(true);
          
          if (requireAdmin) {
            const { data: roleData } = await supabase
              .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
            setIsAdmin(!!roleData);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        
        if (requireAdmin) {
          const { data: roleData } = await supabase
            .rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
          setIsAdmin(!!roleData);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
