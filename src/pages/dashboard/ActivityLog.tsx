import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityLog = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    if (userAgent.toLowerCase().includes('mobile')) return <Smartphone className="h-5 w-5" />;
    if (userAgent.toLowerCase().includes('tablet')) return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceType = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.toLowerCase().includes('mobile')) return 'Mobile';
    if (userAgent.toLowerCase().includes('tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getBrowserName = (userAgent: string) => {
    if (!userAgent) return 'Unknown Browser';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  if (loading) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary">history_edu</span>
        <h2 className="font-headline-md text-headline-md">Login Activity</h2>
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No activity recorded yet</p>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="mt-1 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  {getDeviceType(activity.user_agent) === 'Mobile' ? 'smartphone' : 'desktop_windows'}
                </span>
              </div>
              <div className={`flex-1 pb-3 ${index !== activities.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="flex justify-between items-start">
                  <h4 className="font-label-md">{getBrowserName(activity.user_agent)} on {getDeviceType(activity.user_agent)}</h4>
                  {index === 0 && (
                    <span className="text-[10px] uppercase font-bold text-on-tertiary-container bg-tertiary-fixed rounded px-1.5 py-0.5">Current</span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{activity.action} • {activity.ip_address || 'N/A'}</p>
                <p className="text-[10px] text-outline mt-0.5">{activity.location || 'Unknown'} • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
