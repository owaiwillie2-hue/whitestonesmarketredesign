import { useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Users, DollarSign, Download, FileText, 
  GitBranch, Settings, LogOut, Menu, X, Moon, Sun, Bell, TrendingUp, Shield, Monitor
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useTheme } from '@/contexts/ThemeContext';

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
    { icon: LayoutDashboard, label: 'Analytics', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: DollarSign, label: 'Deposits', path: '/admin/deposits' },
    { icon: Download, label: 'Withdrawals', path: '/admin/withdrawals' },
    { icon: TrendingUp, label: 'Bonus', path: '/admin/bonus' },
    { icon: FileText, label: 'Investment Plans', path: '/admin/investment-plans' },
    { icon: Shield, label: 'KYC', path: '/admin/kyc' },
    { icon: GitBranch, label: 'Referrals', path: '/admin/referrals' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: Monitor, label: 'Activity Logs', path: '/admin/activity-logs' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-body-md text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-primary text-white border-b border-primary/20 flex items-center justify-between px-4 h-16 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-white/10 active:scale-95 transition-all"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg p-1 flex items-center justify-center">
              <img src={logo} alt="Whitestones" className="max-w-full max-h-full object-contain" />
            </div>
            <span className="font-bold text-lg font-display-lg">Admin</span>
          </Link>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white hover:bg-white/10 rounded-full">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen w-64
        bg-primary text-white transition-transform duration-300 md:translate-x-0 shadow-2xl md:shadow-none
        flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-lg shadow-black/10">
              <img src={logo} alt="Whitestones" className="max-w-full max-h-full object-contain" />
            </div>
            <span className="font-bold text-xl font-display-lg tracking-tight">Whitestones</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-label-md
                ${isActive(item.path) 
                  ? 'bg-white text-primary shadow-md font-bold scale-[1.02]' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-primary' : 'text-blue-200'}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all font-label-md"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-20 items-center justify-between px-8 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-white font-display-lg">Admin Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your platform efficiently</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              A
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-y-auto w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
