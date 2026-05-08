import { ReactNode, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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
    { icon: 'group_add', label: 'Refer & Earn', path: '/dashboard/referrals' },
    { icon: 'account_circle', label: 'Profile', path: '/dashboard/profile' },
    { icon: 'settings', label: 'Settings', path: '/dashboard/settings' },
  ];

  const notifications = [
    { id: 1, title: 'Welcome to Whitestones', desc: 'Your account has been created.', time: 'Just now' },
    { id: 2, title: 'Complete KYC', desc: 'Please verify your identity to start investing.', time: '2 mins ago' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Top App Bar */}
      <header className="lg:hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 flex justify-between items-center h-16 px-4 w-full">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)} className="text-on-surface-variant active:scale-95 transition-transform flex items-center p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shrink-0">
            <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-['Plus_Jakarta_Sans'] tracking-tight">WhitestonesMarket</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="text-on-surface-variant hover:text-primary active:scale-95 transition-transform flex items-center">
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          {/* Notification Bell Dropdown (Mobile) */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            {/* Mobile Dropdown Menu */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-2 w-72 bg-surface dark:bg-slate-900 border border-outline-variant/30 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-outline-variant/30 flex justify-between items-center">
                    <h3 className="font-headline-sm font-bold text-primary text-sm">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-on-surface-variant hover:text-error">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 border-b border-outline-variant/20 hover:bg-surface-variant/50 cursor-pointer transition-colors">
                        <p className="font-label-md font-bold text-on-surface text-sm">{notif.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{notif.desc}</p>
                        <p className="text-[9px] text-outline mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 bg-surface-variant/30 border-t border-outline-variant/30 text-center">
                    <button className="text-xs font-bold text-primary hover:underline">Mark all as read</button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Mobile Profile Icon */}
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-primary-fixed shrink-0 cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar & Mobile Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-[100] lg:z-40 w-64 bg-surface dark:bg-slate-900 shadow-2xl lg:shadow-none lg:border-r border-outline-variant/30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-outline-variant/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shrink-0">
            <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-primary font-['Plus_Jakarta_Sans'] tracking-tight">Whitestones</span>
          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full font-label-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white font-bold shadow-md' 
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
        
        <div className="p-4 border-t border-outline-variant/30 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-full font-label-md text-error hover:bg-error/10 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

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
        <header className="hidden lg:flex bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 h-20 items-center justify-between px-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
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

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-surface dark:bg-slate-900 border border-outline-variant/30 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center">
                      <h3 className="font-headline-sm font-bold text-primary">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-outline-variant/20 hover:bg-surface-variant/50 cursor-pointer transition-colors">
                          <p className="font-label-md font-bold text-on-surface">{notif.title}</p>
                          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{notif.desc}</p>
                          <p className="text-[10px] text-outline mt-2">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 text-center bg-surface-container-lowest">
                      <Link to="/dashboard/notifications" className="text-xs font-bold text-secondary-container hover:underline">View all</Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Desktop Profile Icon */}
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary-fixed shrink-0 cursor-pointer" onClick={() => navigate('/dashboard/profile')}>
              <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
