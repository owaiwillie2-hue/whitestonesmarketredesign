import { ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'receipt_long', label: 'Activity', path: '/dashboard/transactions' },
    { icon: 'trending_up', label: 'Invest', path: '/dashboard/invest' },
    { icon: 'account_balance_wallet', label: 'Plans', path: '/dashboard/plans' },
    { icon: 'more_horiz', label: 'More', path: '/dashboard/profile' }, // Or a menu drawer
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      {/* Top App Bar */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 fixed top-0 z-50 flex justify-between items-center h-16 px-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-primary-fixed">
            {/* Can replace with user profile image if available */}
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-lg">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">White Stone Market</span>
        </div>
        <Link to="/dashboard/notifications" className="text-blue-500 dark:text-blue-400 active:scale-95 transition-transform duration-200 flex items-center">
          <span className="material-symbols-outlined">notifications</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="mt-20 px-4 flex flex-col gap-6 max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] fixed bottom-0 w-full z-50 rounded-t-2xl flex justify-around items-center h-20 pb-safe px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center justify-center px-3 py-1 font-['Plus_Jakarta_Sans'] text-[10px] font-medium active:scale-90 transition-all duration-150 ${
                isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl" 
                  : "text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-300"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
