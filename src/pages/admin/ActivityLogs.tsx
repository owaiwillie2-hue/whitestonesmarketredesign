import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export const AdminActivityLogs = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(500);

      setActivities(data || []);
      setFilteredActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = activities.filter(activity =>
      activity.profiles?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      activity.profiles?.email?.toLowerCase().includes(query.toLowerCase()) ||
      activity.ip_address?.toLowerCase().includes(query.toLowerCase()) ||
      activity.location?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredActivities(filtered);
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <span className="material-symbols-outlined text-[18px] text-slate-400">devices</span>;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return <span className="material-symbols-outlined text-[18px] text-slate-400">smartphone</span>;
    if (ua.includes('tablet')) return <span className="material-symbols-outlined text-[18px] text-slate-400">tablet_mac</span>;
    return <span className="material-symbols-outlined text-[18px] text-slate-400">desktop_windows</span>;
  };

  const getDeviceType = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'Mobile';
    if (ua.includes('tablet')) return 'Tablet';
    return 'Desktop';
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Login Activity Logs</h1>
        <p className="text-xs text-slate-500 mt-1">Monitor all user login operations and device sessions</p>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">All Login Activities ({filteredActivities.length})</CardTitle>
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <Input
                placeholder="Search by user, IP, or location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No activity logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Device</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">IP Address</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Location</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Action</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{activity.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-[11px] text-slate-500">{activity.profiles?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {getDeviceIcon(activity.user_agent)}
                          <span>{getDeviceType(activity.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400 px-6 py-4">{activity.ip_address || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300 px-6 py-4">{activity.location || 'Unknown'}</TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                          {activity.action || 'login'}
                        </span>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-500 px-6 py-4">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogs;

