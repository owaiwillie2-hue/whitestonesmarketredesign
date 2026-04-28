import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsCenterProps {
  onOpenChange?: (open: boolean) => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  onOpenChange,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getCategoryColor = (type: string) => {
    const colors: { [key: string]: string } = {
      payment_updates: 'bg-blue-100 text-blue-800',
      withdraw_downtime: 'bg-yellow-100 text-yellow-800',
      investment_updates: 'bg-green-100 text-green-800',
      server_issues: 'bg-red-100 text-red-800',
      schedule_changes: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">notifications</span>
          <h2 className="font-headline-md text-lg text-primary">All Updates</h2>
          {unreadCount > 0 && (
            <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} NEW
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <span className="material-symbols-outlined animate-spin text-secondary">progress_activity</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card border border-outline-variant p-8 rounded-xl text-center">
          <p className="font-body-md text-on-surface-variant">
            You have no notifications yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-card border border-outline-variant p-4 rounded-xl flex items-start gap-4 shadow-sm transition-opacity ${notification.is_read ? 'opacity-70 bg-surface-container-lowest' : 'bg-white'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.is_read ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary-container text-on-primary-container'}`}>
                <span className="material-symbols-outlined text-[20px]">
                  {notification.is_read ? 'notifications' : 'notifications_active'}
                </span>
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-headline-md text-sm text-on-surface leading-tight">
                    {notification.title}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getCategoryColor(notification.type || 'general')}`}>
                    {(notification.type || 'general').replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-outline font-label-md">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-[10px] uppercase font-bold text-secondary-container hover:bg-secondary-container/10 px-2 py-1 rounded transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-outline hover:text-error transition-colors p-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
