import { ReactNode, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'receipt_long', label: 'Activity', path: '/dashboard/transactions' },
    { icon: 'trending_up', label: 'Investments', path: '/dashboard/investments' },
    { icon: 'account_balance_wallet', label: 'Plans', path: '/dashboard/plans' },
    { icon: 'verified_user', label: 'KYC', path: '/dashboard/kyc' },
    { icon: 'account_circle', label: 'Profile', path: '/dashboard/profile' },
    { icon: 'settings', label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* Top App Bar */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 fixed top-0 z-50 flex justify-between items-center h-16 px-4 w-full">
        <div className="flex items-center gap-2">
          {/* Site Menu Icon (Hamburger) */}
          <button onClick={() => setSidebarOpen(true)} className="text-on-surface-variant active:scale-95 transition-transform flex items-center p-1 rounded-full hover:bg-slate-100">
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          {/* Logo and Name joined together */}
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 ml-1 shrink-0">
            <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight whitespace-nowrap">WhitestonesMarket</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/dashboard/notifications" className="text-blue-500 dark:text-blue-400 active:scale-95 transition-transform duration-200 flex items-center">
            <span className="material-symbols-outlined">notifications</span>
          </Link>
          {/* Gmail profile icon moved to right side */}
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-primary-fixed shrink-0 cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
          
          {/* Drawer */}
          <div className="relative w-64 max-w-[80vw] h-full bg-surface shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-outline-variant/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shrink-0">
                <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-bold text-primary font-['Plus_Jakarta_Sans'] tracking-tight">WhitestonesMarket</span>
            </div>
            
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link 
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-full font-label-md transition-colors ${
                      isActive 
                        ? 'bg-secondary-container/10 text-secondary-container font-bold' 
                        : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
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
            
            <div className="p-4 border-t border-outline-variant/30">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-full font-label-md text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 px-4 pb-8 flex flex-col gap-6 max-w-lg mx-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
