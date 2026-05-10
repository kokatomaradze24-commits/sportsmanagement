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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      age_development_plans: {
        Row: {
          age_group: string
          created_at: string
          id: string
          plan: string
          sport: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group: string
          created_at?: string
          id?: string
          plan?: string
          sport?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          id?: string
          plan?: string
          sport?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_purchases: {
        Row: {
          amount: number
          created_at: string
          credits: number
          currency: string
          id: string
          package_id: string
          provider: string
          provider_capture_id: string | null
          provider_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credits: number
          currency?: string
          id?: string
          package_id: string
          provider?: string
          provider_capture_id?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          package_id?: string
          provider?: string
          provider_capture_id?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string | null
          value?: string | null
        }
        Relationships: []
      }
      coaches: {
        Row: {
          created_at: string
          display_name: string
          generated_password: string | null
          id: string
          is_active: boolean
          password_hash: string
          sport: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name: string
          generated_password?: string | null
          id?: string
          is_active?: boolean
          password_hash: string
          sport?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string
          generated_password?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string
          sport?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          coach_id: string | null
          created_at: string
          end_time: string | null
          game_date: string
          id: string
          location: string | null
          notes: string | null
          opponent: string | null
          sport: string
          start_time: string | null
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          end_time?: string | null
          game_date: string
          id?: string
          location?: string | null
          notes?: string | null
          opponent?: string | null
          sport?: string
          start_time?: string | null
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          end_time?: string | null
          game_date?: string
          id?: string
          location?: string | null
          notes?: string | null
          opponent?: string | null
          sport?: string
          start_time?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          player_id: string
          sport: string
          status: string
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          player_id: string
          sport?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          player_id?: string
          sport?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_registration_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sport: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sport?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sport?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_registration_requests: {
        Row: {
          birth_date: string
          created_at: string
          experience_level: string
          first_name: string
          id: string
          last_coach: string | null
          last_name: string
          league: string | null
          link_id: string
          notes: string | null
          parent_phone: string | null
          phone: string | null
          previous_club: string | null
          previous_team: string | null
          primary_contact: string
          reviewed_at: string | null
          sport: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          experience_level?: string
          first_name: string
          id?: string
          last_coach?: string | null
          last_name: string
          league?: string | null
          link_id: string
          notes?: string | null
          parent_phone?: string | null
          phone?: string | null
          previous_club?: string | null
          previous_team?: string | null
          primary_contact?: string
          reviewed_at?: string | null
          sport?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          experience_level?: string
          first_name?: string
          id?: string
          last_coach?: string | null
          last_name?: string
          league?: string | null
          link_id?: string
          notes?: string | null
          parent_phone?: string | null
          phone?: string | null
          previous_club?: string | null
          previous_team?: string | null
          primary_contact?: string
          reviewed_at?: string | null
          sport?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          monthly_fee: number
          notes: string | null
          parent_phone: string | null
          phone: string | null
          primary_contact: string
          sport: string
          start_day: number
          start_month: number
          start_year: number
          subscription_months: number
          t_number: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          monthly_fee?: number
          notes?: string | null
          parent_phone?: string | null
          phone?: string | null
          primary_contact?: string
          sport?: string
          start_day?: number
          start_month?: number
          start_year?: number
          subscription_months?: number
          t_number: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          monthly_fee?: number
          notes?: string | null
          parent_phone?: string | null
          phone?: string | null
          primary_contact?: string
          sport?: string
          start_day?: number
          start_month?: number
          start_year?: number
          subscription_months?: number
          t_number?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      practice_templates: {
        Row: {
          age_group: string
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          location: string | null
          sport: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group: string
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          location?: string | null
          sport?: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          location?: string | null
          sport?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practices: {
        Row: {
          age_group: string | null
          coach_id: string | null
          created_at: string
          end_time: string | null
          id: string
          location: string | null
          notes: string | null
          practice_date: string
          sport: string
          start_time: string | null
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          coach_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          practice_date: string
          sport?: string
          start_time?: string | null
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          coach_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          practice_date?: string
          sport?: string
          start_time?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practices_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          message: string
          payment_id: string | null
          phone: string
          player_id: string | null
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          message: string
          payment_id?: string | null
          phone: string
          player_id?: string | null
          provider: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          message?: string
          payment_id?: string | null
          phone?: string
          player_id?: string | null
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          player_id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          sport: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          sport?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          sport?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_participants: {
        Row: {
          created_at: string
          deposit_amount: number
          deposit_paid_at: string | null
          final_amount: number
          final_paid_at: string | null
          id: string
          notes: string | null
          player_id: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number
          deposit_paid_at?: string | null
          final_amount?: number
          final_paid_at?: string | null
          id?: string
          notes?: string | null
          player_id: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          deposit_paid_at?: string | null
          final_amount?: number
          final_paid_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          currency: string
          id: string
          location: string | null
          name: string
          notes: string | null
          price: number
          sport: string
          trip_date: string
          trip_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          price?: number
          sport?: string
          trip_date: string
          trip_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          price?: number
          sport?: string
          trip_date?: string
          trip_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ai_credits: {
        Row: {
          credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          credits?: number
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_sms_settings: {
        Row: {
          created_at: string
          email_from: string | null
          email_from_name: string | null
          enabled: boolean
          id: string
          magti_api_key: string | null
          magti_sender: string | null
          provider: string
          reminder_days_before: number
          send_overdue: boolean
          send_reminder: boolean
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_from: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_from?: string | null
          email_from_name?: string | null
          enabled?: boolean
          id?: string
          magti_api_key?: string | null
          magti_sender?: string | null
          provider?: string
          reminder_days_before?: number
          send_overdue?: boolean
          send_reminder?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_from?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_from?: string | null
          email_from_name?: string | null
          enabled?: boolean
          id?: string
          magti_api_key?: string | null
          magti_sender?: string | null
          provider?: string
          reminder_days_before?: number
          send_overdue?: boolean
          send_reminder?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_from?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          activated_at: string
          activated_by: string | null
          created_at: string
          expires_at: string
          id: string
          is_trial: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_trial?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_trial?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_deactivate_subscription: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      admin_extend_subscription: {
        Args: { _days: number; _user_id: string }
        Returns: string
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          is_admin: boolean
          is_trial: boolean
          last_sign_in_at: string
          payment_count: number
          player_count: number
          subscription_expires_at: string
          user_id: string
        }[]
      }
      admin_storage_stats: {
        Args: never
        Returns: {
          db_bytes: number
          db_limit_bytes: number
          storage_bytes: number
          storage_file_count: number
          storage_limit_bytes: number
        }[]
      }
      admin_toggle_admin: { Args: { _user_id: string }; Returns: undefined }
      generate_player_payments: {
        Args: { _player_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_subscription_active: { Args: { _user_id: string }; Returns: boolean }
      mark_overdue_payments: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
