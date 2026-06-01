import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  user_id?: string;
  created_at: string;
}

export const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchSentNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSentNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setSentNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    try {
      setLoading(true);

      if (sendToAll) {
        // Send to all users + broadcast (NULL user_id)
        await supabase.from('notifications').insert([{
          user_id: null, // Broadcast to all
          title,
          message,
          type: category as any,
        }]);
      } else {
        if (!selectedUserId) {
          toast.error('Please select a user');
          return;
        }

        // Send to specific user
        await supabase.from('notifications').insert([{
          user_id: selectedUserId,
          title,
          message,
          type: category as any,
        }]);
      }

      toast.success(
        sendToAll
          ? 'Notification sent to all users'
          : 'Notification sent to selected user'
      );

      setTitle('');
      setMessage('');
      setCategory('general');
      setSelectedUserId('');
      setSendToAll(true);

      // Refresh sent notifications
      fetchSentNotifications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (type: string) => {
    const colors: { [key: string]: string } = {
      payment_updates: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      withdraw_downtime: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      investment_updates: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      server_issues: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      schedule_changes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      general: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
    };
    return colors[type] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
  };

  const formatCategoryName = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Notification Management</h1>
        <p className="text-xs text-slate-500 mt-1">Broadcast system announcements or send targeted notices to users</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Compose Section */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Compose Notification</CardTitle>
            <CardDescription className="text-[11px] text-slate-500">Create a new message and publish it immediately</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSend} className="space-y-5">
              {/* Send To Toggle */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-900 dark:text-white">Recipient Scope</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSendToAll(true)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      sendToAll 
                        ? 'bg-primary border-primary text-white shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">campaign</span>
                    All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendToAll(false)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      !sendToAll 
                        ? 'bg-primary border-primary text-white shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    Specific User
                  </button>
                </div>

                {!sendToAll && (
                  <div className="mt-3">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Search or select user..." />
                      </SelectTrigger>
                      <SelectContent className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-xs">
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-slate-900 dark:text-white">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Scheduled System Upgrade"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold text-slate-900 dark:text-white">Message Body</Label>
                <Textarea
                  id="message"
                  placeholder="Type the notification details here..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1 p-3"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-slate-900 dark:text-white">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                    <SelectItem value="payment_updates" className="text-xs">Payment Updates</SelectItem>
                    <SelectItem value="withdraw_downtime" className="text-xs">Withdraw Downtime</SelectItem>
                    <SelectItem value="investment_updates" className="text-xs">Investment Updates</SelectItem>
                    <SelectItem value="server_issues" className="text-xs">Server Issues</SelectItem>
                    <SelectItem value="schedule_changes" className="text-xs">Schedule Changes</SelectItem>
                    <SelectItem value="general" className="text-xs">General Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Send Button */}
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                {loading ? (
                  'Publishing message...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">history</span>
              Publish Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {sentNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-medium">
                  No notifications published yet
                </div>
              ) : (
                sentNotifications.map((notif) => (
                  <div key={notif.id} className="text-xs border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-b-0 last:pb-0 space-y-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${getCategoryColor(notif.type)}`}>
                        {formatCategoryName(notif.type)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {format(new Date(notif.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;

