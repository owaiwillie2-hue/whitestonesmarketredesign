export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_balances: {
        Row: {
          account_active_since: string | null
          created_at: string
          id: string
          investment_balance: number | null
          main_balance: number | null
          profit_balance: number | null
          referral_balance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_active_since?: string | null
          created_at?: string
          id?: string
          investment_balance?: number | null
          main_balance?: number | null
          profit_balance?: number | null
          referral_balance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_active_since?: string | null
          created_at?: string
          id?: string
          investment_balance?: number | null
          main_balance?: number | null
          profit_balance?: number | null
          referral_balance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_form_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: string
          submitted_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address: string
          submitted_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string
          submitted_at?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          proof_url: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          proof_url?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investment_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          name: string
          profit_percentage: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount: number
          name: string
          profit_percentage: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          name?: string
          profit_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          end_date: string
          expected_profit: number | null
          id: string
          plan_id: string
          profit: number | null
          start_date: string
          status: Database["public"]["Enums"]["investment_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          end_date: string
          expected_profit?: number | null
          id?: string
          plan_id: string
          profit?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string
          expected_profit?: number | null
          id?: string
          plan_id?: string
          profit?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"] | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          document_type: string
          document_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          document_type?: string
          document_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"] | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_global: boolean | null
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          phone_number: string | null
          referral_code: string | null
          state: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
          is_suspended: boolean | null
          is_restricted: boolean | null
          current_plan_override_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_number?: string | null
          referral_code?: string | null
          state?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
          is_suspended?: boolean | null
          is_restricted?: boolean | null
          current_plan_override_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_number?: string | null
          referral_code?: string | null
          state?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
          is_suspended?: boolean | null
          is_restricted?: boolean | null
          current_plan_override_id?: string | null
        }
        Relationships: []
      }
      redeemable_bonuses: {
        Row: {
          admin_id: string
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          is_redeemed: boolean | null
          message: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          admin_id: string
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          message: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          message?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          bonus_paid: boolean | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_amount?: number | null
          bonus_paid?: boolean | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_amount?: number | null
          bonus_paid?: boolean | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          created_at: string
          from_wallet: string
          id: string
          processed_at: string | null
          status: string
          to_wallet: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_wallet: string
          id?: string
          processed_at?: string | null
          status?: string
          to_wallet: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_wallet?: string
          id?: string
          processed_at?: string | null
          status?: string
          to_wallet?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          investment_balance: number | null
          main_balance: number | null
          profit_balance: number | null
          referral_balance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          investment_balance?: number | null
          main_balance?: number | null
          profit_balance?: number | null
          referral_balance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          investment_balance?: number | null
          main_balance?: number | null
          profit_balance?: number | null
          referral_balance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      withdrawal_accounts: {
        Row: {
          account_details: Json
          account_type: string
          created_at: string
          id: string
          is_default: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_details: Json
          account_type: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_details?: Json
          account_type?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
          wallet_type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
          wallet_type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_contact_submissions: { Args: never; Returns: undefined }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      investment_status: "active" | "completed" | "cancelled"
      kyc_status: "pending" | "approved" | "rejected"
      transaction_status: "pending" | "completed" | "rejected" | "processing"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "profit"
        | "referral_bonus"
        | "investment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      investment_status: ["active", "completed", "cancelled"],
      kyc_status: ["pending", "approved", "rejected"],
      transaction_status: ["pending", "completed", "rejected", "processing"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "profit",
        "referral_bonus",
        "investment",
      ],
    },
  },
} as const
