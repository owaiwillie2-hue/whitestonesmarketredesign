import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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
          weeklyPayouts: totalAmount * 0.05,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-soft">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Space X Retirement Funds Backend</h1>
            <p className="text-xs text-slate-500 mt-1">Manage retirement program members, real-time statistics, and deposits.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/admin'} 
            className="h-10 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors shadow-sm"
          >
            Back to Main Admin
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeMembers}</div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">${stats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">${stats.weeklyPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.withdrawals}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Recent Enrollments & Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Date</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">User</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Amount</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 h-10 px-6">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const dob = member.profiles?.date_of_birth;
                      const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : 'Unknown';
                      return (
                        <TableRow key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors">
                          <TableCell className="text-[11px] text-slate-500 px-6 py-4">
                            {new Date(member.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div>
                              <p className="font-bold text-xs text-slate-900 dark:text-white">{member.profiles?.full_name || 'N/A'}</p>
                              <p className="text-[11px] text-slate-500">{member.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-slate-900 dark:text-white px-6 py-4">${member.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              member.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              member.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                member.status === 'completed' ? 'bg-green-500' :
                                member.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></span>
                              {member.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 dark:text-slate-300 px-6 py-4">{age}</TableCell>
                        </TableRow>
                      );
                    })}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-xs font-medium">No records found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpaceXAdmin;

