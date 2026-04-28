import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${user.id},is_global.eq.true`)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { unreadCount, loading, refetch: fetchUnreadCount };
};
