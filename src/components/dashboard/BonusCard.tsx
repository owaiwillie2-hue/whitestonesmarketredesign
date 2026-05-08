import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';

interface RedeemableBonus {
  id: string;
  amount: number;
  message: string;
  created_at: string;
  is_redeemed: boolean;
}

export const BonusCard = () => {
  const [bonuses, setBonuses] = useState<RedeemableBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    fetchBonuses();

    // Set up real-time subscription
    const channel = supabase
      .channel('redeemable-bonuses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redeemable_bonuses'
        },
        () => {
          fetchBonuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBonuses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('redeemable_bonuses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_redeemed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBonuses(data || []);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (bonusId: string) => {
    setRedeeming(bonusId);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-bonus', {
        body: { bonus_id: bonusId },
      });

      if (error) throw error;

      toast.success(`Bonus redeemed! $${data.amount} added to your balance`);
      fetchBonuses();
    } catch (error) {
      console.error('Error redeeming bonus:', error);
      toast.error('Failed to redeem bonus');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return null;
  }

  if (bonuses.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Available Bonuses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bonuses.map((bonus) => (
          <div
            key={bonus.id}
            className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <Badge variant="secondary" className="font-bold">
                    ${bonus.amount.toFixed(2)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{bonus.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Received: {new Date(bonus.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleRedeem(bonus.id)}
                disabled={redeeming === bonus.id}
              >
                {redeeming === bonus.id ? 'Redeeming...' : 'Redeem'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};