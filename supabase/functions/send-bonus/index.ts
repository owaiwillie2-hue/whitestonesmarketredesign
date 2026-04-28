import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendBonusRequest {
  user_id: string;
  admin_id: string;
  amount: number;
  notification_message: string;
  bonus_type: 'direct' | 'redeemable';
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

    const { user_id, admin_id, amount, notification_message, bonus_type }: SendBonusRequest = await req.json();

    console.log('Send bonus request:', { user_id, admin_id, amount, bonus_type });

    // Verify admin role
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', admin_id)
      .eq('role', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('Admin verification failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user_id)
      .single();

    if (userError || !userProfile) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (bonus_type === 'redeemable') {
      // Create redeemable bonus
      const { error: redeemableError } = await supabase
        .from('redeemable_bonuses')
        .insert({
          user_id: user_id,
          admin_id: admin_id,
          amount: amount,
          message: notification_message,
          is_redeemed: false,
        });

      if (redeemableError) {
        console.error('Error creating redeemable bonus:', redeemableError);
        return new Response(
          JSON.stringify({ error: 'Failed to create redeemable bonus' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create admin note
      await supabase
        .from('admin_notes')
        .insert({
          user_id: user_id,
          created_by: admin_id,
          note: `Created redeemable bonus of $${amount}. Message: ${notification_message}`,
        });

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          title: 'New Bonus Available',
          message: `You have a new bonus of $${amount} waiting to be redeemed!`,
          type: 'bonus',
          is_read: false,
        });

      console.log('Redeemable bonus created successfully');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Redeemable bonus created successfully',
          bonus_type: 'redeemable',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Direct bonus - add to balance immediately
      const { data: currentBalance, error: balanceError } = await supabase
        .from('account_balances')
        .select('main_balance')
        .eq('user_id', user_id)
        .single();

      if (balanceError) {
        console.error('Error fetching balance:', balanceError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user balance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newMainBalance = (currentBalance.main_balance || 0) + amount;

      // Update main balance
      const { error: updateError } = await supabase
        .from('account_balances')
        .update({ main_balance: newMainBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update balance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update wallets table as well
      await supabase
        .from('wallets')
        .update({ main_balance: newMainBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user_id,
          type: 'deposit',
          amount: amount,
          status: 'completed',
          description: `Direct bonus from admin: ${notification_message}`,
        });

      // Create admin note
      await supabase
        .from('admin_notes')
        .insert({
          user_id: user_id,
          created_by: admin_id,
          note: `Sent direct bonus of $${amount}. Message: ${notification_message}`,
        });

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          title: 'Bonus Received',
          message: notification_message,
          type: 'bonus',
          is_read: false,
        });

      console.log('Direct bonus sent successfully');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Direct bonus sent successfully',
          new_balance: newMainBalance,
          bonus_type: 'direct',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in send-bonus function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});