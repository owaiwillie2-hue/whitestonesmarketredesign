import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedeemBonusRequest {
  bonus_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { bonus_id }: RedeemBonusRequest = await req.json();

    // Get user from auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Redeem bonus request:', { bonus_id, user_id: user.id });

    // Get bonus details
    const { data: bonus, error: bonusError } = await supabase
      .from('redeemable_bonuses')
      .select('*')
      .eq('id', bonus_id)
      .eq('user_id', user.id)
      .single();

    if (bonusError || !bonus) {
      console.error('Bonus not found:', bonusError);
      return new Response(
        JSON.stringify({ error: 'Bonus not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (bonus.is_redeemed) {
      return new Response(
        JSON.stringify({ error: 'Bonus already redeemed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current balance
    const { data: currentBalance, error: balanceError } = await supabase
      .from('account_balances')
      .select('main_balance')
      .eq('user_id', user.id)
      .single();

    if (balanceError) {
      console.error('Error fetching balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newMainBalance = (currentBalance.main_balance || 0) + bonus.amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('account_balances')
      .update({ main_balance: newMainBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update wallets table
    await supabase
      .from('wallets')
      .update({ main_balance: newMainBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Mark bonus as redeemed
    const { error: redeemError } = await supabase
      .from('redeemable_bonuses')
      .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', bonus_id);

    if (redeemError) {
      console.error('Error marking bonus as redeemed:', redeemError);
    }

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: bonus.amount,
        status: 'completed',
        description: `Redeemed bonus: ${bonus.message}`,
      });

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Bonus Redeemed',
        message: `You have successfully redeemed $${bonus.amount} bonus!`,
        type: 'bonus',
        is_read: false,
      });

    console.log('Bonus redeemed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bonus redeemed successfully',
        amount: bonus.amount,
        new_balance: newMainBalance,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in redeem-bonus function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});