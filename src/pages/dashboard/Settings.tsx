import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import Profile from './Profile';
import WithdrawalAccounts from './WithdrawalAccounts';
import ActivityLog from './ActivityLog';
import { TwoFactorSetup } from '@/components/dashboard/TwoFactorSetup';

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    try {
      if (!newPassword) throw new Error("Please enter a new password");
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully changed.',
      });
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Page Title */}
      <section>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Account Settings</h1>
        <p className="font-body-md text-on-surface-variant mt-1">Manage your professional profile and security</p>
      </section>

      {/* Premium Bento Navigation */}
      <nav className="flex overflow-x-auto gap-3 hide-scrollbar pb-2">
        <a href="#profile" className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md shadow-md active:scale-95 transition-all">Profile</a>
        <a href="#accounts" className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white border border-outline-variant text-on-surface-variant font-label-md active:scale-95 transition-all">Accounts</a>
        <a href="#security" className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white border border-outline-variant text-on-surface-variant font-label-md active:scale-95 transition-all">Security</a>
        <a href="#activity" className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white border border-outline-variant text-on-surface-variant font-label-md active:scale-95 transition-all">Activity</a>
      </nav>

      {/* Sections */}
      <div id="profile" className="scroll-mt-24">
        <Profile />
      </div>

      <div id="accounts" className="scroll-mt-24">
        <WithdrawalAccounts />
      </div>

      <div id="security" className="scroll-mt-24 space-y-6">
        <TwoFactorSetup />
        
        {/* Password Change Sub-section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary">password</span>
            <h2 className="font-headline-md text-headline-md">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1">New Password</label>
              <input
                type="password"
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-secondary-container transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              onClick={handlePasswordChange}
              className="w-full py-4 bg-secondary-container text-on-secondary-container font-label-md rounded-full active:scale-[0.98] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      <div id="activity" className="scroll-mt-24">
        <ActivityLog />
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleSignOut}
        className="w-full py-4 text-error font-label-md flex items-center justify-center gap-2 mt-4 active:bg-error/5 rounded-full transition-all"
      >
        <span className="material-symbols-outlined">logout</span>
        Sign Out of Account
      </button>
    </div>
  );
};

export default Settings;
