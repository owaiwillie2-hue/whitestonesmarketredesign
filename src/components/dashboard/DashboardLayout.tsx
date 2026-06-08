import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import logo from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationCount } from '@/hooks/useNotificationCount';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSpaceXModal, setShowSpaceXModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Temporarily default to true if date_of_birth is missing for testing purposes
  const isSpaceXEligible = profile?.date_of_birth ? calculateAge(profile.date_of_birth) >= 40 : true;

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', isNew: false },
    { icon: 'receipt_long', label: 'Activity', path: '/dashboard/transactions', isNew: false },
    { icon: 'trending_up', label: 'Investments', path: '/dashboard/investments', isNew: false },
    { icon: 'account_balance_wallet', label: 'Plans', path: '/dashboard/plans', isNew: false },
    ...(isSpaceXEligible ? [{ icon: 'rocket_launch', label: 'Space X Retirement', path: '/dashboard/spacex', isNew: true }] : []),
    { icon: 'verified_user', label: 'KYC', path: '/dashboard/kyc', isNew: false },
    { icon: 'group_add', label: 'Refer & Earn', path: '/dashboard/referrals', isNew: false },
    { icon: 'account_circle', label: 'Profile', path: '/dashboard/profile', isNew: false },
    { icon: 'settings', label: 'Settings', path: '/dashboard/settings', isNew: false },
  ];

  const [notifications, setNotifications] = useState<any[]>([]);
  const { unreadCount, refetch: refetchUnreadCount } = useNotificationCount();
  const [activeNotificationModal, setActiveNotificationModal] = useState<any | null>(null);

  useEffect(() => {
    if (profile?.date_of_birth && user?.id) {
      const age = calculateAge(profile.date_of_birth);
      if (age >= 40) {
        const hasSeenModal = localStorage.getItem(`has_seen_spacex_${user.id}`);
        if (!hasSeenModal) {
          setShowSpaceXModal(true);
        }
      }
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user?.id) return;
 
    const loadLayoutData = async () => {
      try {
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (notificationsData) {
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error('Error loading layout data:', error);
      }
    };
 
    loadLayoutData();

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as any;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
          setActiveNotificationModal(newNotif);
          refetchUnreadCount();
        }
      )
      .subscribe();

    // Also listen for global notifications (broadcast to all users)
    const globalChannel = supabase
      .channel('public:global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `is_global=eq.true` },
        (payload) => {
          const newNotif = payload.new as any;
          // Avoid duplicates if already matched by user_id filter
          setNotifications((prev) => {
            if (prev.find(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev].slice(0, 10);
          });
          setActiveNotificationModal(newNotif);
          refetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    refetchUnreadCount();
  };

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
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-all relative"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
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
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => { setShowNotifications(false); navigate('/dashboard/notifications'); }}
                          className={`p-3 border-b border-outline-variant/20 cursor-pointer transition-colors ${notif.is_read ? 'opacity-70' : 'bg-primary/5 hover:bg-surface-variant/50'}`}
                        >
                          <p className="font-label-md font-bold text-on-surface text-sm">{notif.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">{notif.message || notif.desc}</p>
                          <p className="text-[9px] text-outline mt-1">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-surface-variant/30 border-t border-outline-variant/30 flex justify-between items-center">
                    <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:underline">Mark all read</button>
                    <Link to="/dashboard/notifications" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-secondary-container hover:underline">View all</Link>
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
        <div className="p-4 border-b border-outline-variant/30 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-100 p-0.5 shrink-0">
            <img src={logo} alt="WhitestonesMarket" className="w-full h-full object-contain" />
          </div>
          <span className="text-sm font-bold text-primary font-['Plus_Jakarta_Sans'] tracking-tight">Whitestones</span>
          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white font-bold shadow-md' 
                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.isNew && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase rounded-md tracking-wider animate-pulse shadow-sm shadow-red-500/30">NEW</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-outline-variant/30 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium text-error hover:bg-error/10 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
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
        <header className="hidden lg:flex bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 h-16 items-center justify-between px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
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
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => { setShowNotifications(false); navigate('/dashboard/notifications'); }}
                            className={`p-4 border-b border-outline-variant/20 cursor-pointer transition-colors ${notif.is_read ? 'opacity-70 hover:bg-surface-variant/50' : 'bg-primary/5 hover:bg-primary/10'}`}
                          >
                            <p className="font-label-md font-bold text-on-surface">{notif.title}</p>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed line-clamp-2">{notif.message || notif.desc}</p>
                            <p className="text-[10px] text-outline mt-2">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 flex justify-between items-center bg-surface-container-lowest">
                      <button onClick={markAllAsRead} className="text-xs font-bold text-primary hover:underline">Mark all read</button>
                      <Link to="/dashboard/notifications" onClick={() => setShowNotifications(false)} className="text-xs font-bold text-secondary-container hover:underline">View all</Link>
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 w-full max-w-7xl mx-auto custom-scrollbar">
          {children}
        </main>
      </div>

      {/* SpaceX Auto Popup Modal */}
      {showSpaceXModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Exclusive Retirement Investment Opportunity</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              You qualify for the Space X Retirement Funds program. Start preparing for retirement while earning weekly payouts directly to your bank account.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  localStorage.setItem(`has_seen_spacex_${user?.id}`, 'true');
                  setShowSpaceXModal(false);
                  navigate('/dashboard/spacex');
                }}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold active:scale-[0.98] transition-transform"
              >
                Learn More & Join
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem(`has_seen_spacex_${user?.id}`, 'true');
                  setShowSpaceXModal(false);
                }}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
      {activeNotificationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 font-['Plus_Jakarta_Sans']">
            <button 
              onClick={() => setActiveNotificationModal(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 pr-6 leading-tight">
              {activeNotificationModal.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs mb-6 leading-relaxed max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {activeNotificationModal.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  const notifId = activeNotificationModal.id;
                  setActiveNotificationModal(null);
                  await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', notifId);
                  refetchUnreadCount();
                  navigate(`/dashboard/notifications?highlight=${notifId}`);
                }}
                className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold text-xs active:scale-[0.98] transition-transform shadow-md"
              >
                Open Notification
              </button>
              <button 
                onClick={async () => {
                  const notifId = activeNotificationModal.id;
                  setActiveNotificationModal(null);
                  await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', notifId);
                  refetchUnreadCount();
                  setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
                }}
                className="py-3 px-5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
