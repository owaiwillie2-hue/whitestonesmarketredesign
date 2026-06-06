import { ReactNode, useState } from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useTheme } from '@/contexts/ThemeContext';
import logo from '@/assets/logo.png';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: 'analytics', label: 'Analytics', path: '/admin' },
    { icon: 'group', label: 'Users', path: '/admin/users' },
    { icon: 'workspace_premium', label: 'Users Plans', path: '/admin/users-plans' },
    { icon: 'trending_up', label: 'Active Investments', path: '/admin/investments' },
    { icon: 'payments', label: 'Deposits', path: '/admin/deposits' },
    { icon: 'price_change', label: 'Withdrawals', path: '/admin/withdrawals' },
    { icon: 'local_activity', label: 'Bonus', path: '/admin/bonus' },
    { icon: 'description', label: 'Investment Plans', path: '/admin/investment-plans' },
    { icon: 'verified_user', label: 'KYC', path: '/admin/kyc' },
    { icon: 'diversity_3', label: 'Referrals', path: '/admin/referrals' },
    { icon: 'notifications', label: 'Notifications', path: '/admin/notifications' },
    { icon: 'history', label: 'Activity Logs', path: '/admin/activity-logs' },
    { icon: 'settings', label: 'Settings', path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Top App Bar */}
      <header className="lg:hidden bg-white/80 dark:bg-slate-955/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 flex justify-between items-center h-16 px-4 w-full">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="text-on-surface-variant active:scale-95 transition-transform flex items-center p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shrink-0">
            <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">Admin Console</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="text-on-surface-variant hover:text-primary active:scale-95 transition-transform flex items-center"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          {/* Mobile Profile Icon */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            A
          </div>
        </div>
      </header>

      {/* Desktop Sidebar & Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] lg:z-40 w-64 bg-[#0B1E36] border-r border-blue-950/40 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-blue-950/40 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shrink-0">
            <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold text-white font-['Plus_Jakarta_Sans'] tracking-tight">Whitestones Admin</span>
          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-blue-200 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950/40' 
                    : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-blue-950/40 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full max-w-full">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 h-16 items-center justify-between px-6 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {location.pathname.split('/').pop() || 'Admin Panel'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Profile initials badge */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              A
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto w-full max-w-7xl mx-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
