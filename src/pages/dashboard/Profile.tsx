import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setInitialLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          country: profile.country,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return null;
  }

  if (!profile) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary">person_edit</span>
        <h2 className="font-headline-md text-headline-md">Personal Information</h2>
      </div>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="relative">
          <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1">{t('auth.fullName')}</label>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-secondary-container transition-all"
            value={profile.full_name || ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          />
        </div>
        <div className="relative">
          <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1">{t('auth.email')}</label>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-secondary-container transition-all opacity-70"
            value={profile.email}
            disabled
          />
        </div>
        <div className="relative">
          <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1">{t('auth.phone')}</label>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-secondary-container transition-all"
            value={profile.phone_number || ''}
            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
          />
        </div>
        <div className="relative">
          <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1">{t('auth.country')}</label>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-secondary-container transition-all"
            value={profile.country || ''}
            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
          />
        </div>
        <div className="relative">
          <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1">Language</label>
          <select
            className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-body-md focus:ring-2 focus:ring-secondary-container transition-all"
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-secondary-container text-on-secondary-container font-label-md rounded-full active:scale-[0.98] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
