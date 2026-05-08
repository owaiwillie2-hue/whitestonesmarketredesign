import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SpaceXAdmin = () => {
  const [stats, setStats] = useState({
    activeMembers: 0,
    totalInvested: 0,
    weeklyPayouts: 0,
    withdrawals: 0
  });

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('spacex_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch SpaceX specific deposits or investments (using notes or plan name)
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*, profiles(email, full_name, date_of_birth)')
        .ilike('notes', '%SpaceX%')
        .order('created_at', { ascending: false });
      
      if (depositsData) {
        setMembers(depositsData);
        
        const approved = depositsData.filter(d => d.status === 'completed');
        const totalAmount = approved.reduce((acc, curr) => acc + Number(curr.amount), 0);
        
        setStats({
          activeMembers: approved.length,
          totalInvested: totalAmount,
          weeklyPayouts: (totalAmount * 0.05) / 4,
          withdrawals: 0
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Space X Retirement Funds Backend</h1>
          <p className="text-muted-foreground mt-2">Manage retirement program members, real-time statistics, and deposits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalInvested.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${stats.weeklyPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.withdrawals}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Enrollments & Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading real-time data...</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const dob = member.profiles?.date_of_birth;
                      const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 'Unknown';
                      return (
                        <TableRow key={member.id}>
                          <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{member.profiles?.full_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{member.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">${member.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.status === 'completed' ? 'bg-green-100 text-green-800' :
                              member.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {member.status}
                            </span>
                          </TableCell>
                          <TableCell>{age}</TableCell>
                        </TableRow>
                      );
                    })}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No records found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SpaceXAdmin;
