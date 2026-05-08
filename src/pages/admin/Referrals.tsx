import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

export const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      const userIds = Array.from(new Set((referralsData || []).flatMap((r: any) => [r.referrer_id, r.referred_id])));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const profilesByUser: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profilesByUser[p.user_id] = p; });

      const enriched = (referralsData || []).map((r: any) => ({
        ...r,
        referrer: profilesByUser[r.referrer_id],
        referred: profilesByUser[r.referred_id],
      }));

      setReferrals(enriched || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-bold">Referral Management</h1>
        <p className="text-muted-foreground mt-2">View all referral activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Referrals ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Bonus Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{referral.referrer?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{referral.referrer?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{referral.referred?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{referral.referred?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>${referral.bonus_amount}</TableCell>
                  <TableCell>{referral.bonus_paid ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferrals;
