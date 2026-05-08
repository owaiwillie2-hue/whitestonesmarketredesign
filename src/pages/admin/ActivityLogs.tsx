import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Smartphone, Tablet, Search } from 'lucide-react';

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
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return <Smartphone className="h-5 w-5" />;
    if (ua.includes('tablet')) return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceType = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'Mobile';
    if (ua.includes('tablet')) return 'Tablet';
    return 'Desktop';
  };



  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">Login Activity Logs</h1>
        <p className="text-muted-foreground mt-2">Monitor all user login activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Login Activities ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, IP, or location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{activity.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{activity.profiles?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(activity.user_agent)}
                          <span>{getDeviceType(activity.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{activity.ip_address || 'N/A'}</TableCell>
                      <TableCell>{activity.location || 'Unknown'}</TableCell>
                      <TableCell className="capitalize">{activity.action || 'login'}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogs;
