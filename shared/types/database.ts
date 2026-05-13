// 此檔案由 `pnpm db:gen-types` 自動產生（連線 Supabase 後）。
// 請勿手動編輯；下方的 placeholder 僅供初始 build 不報錯使用。

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          user_id: string
          name: string
          gender: 'M' | 'F'
          age: number | null
          height: number | null
          start_weight: number
          joined_at: string
          is_admin: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          gender: 'M' | 'F'
          age?: number | null
          height?: number | null
          start_weight: number
          joined_at?: string
          is_admin?: boolean
        }
        Update: Partial<Database['public']['Tables']['participants']['Insert']>
      }
      measurements: {
        Row: {
          participant_id: string
          week_index: 0 | 1 | 2 | 3
          weight: number
          fat_pct: number
          muscle: number
          measured_on: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['measurements']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['measurements']['Insert']>
      }
      checkins: {
        Row: {
          participant_id: string
          date: string
          workout: boolean
          diet: boolean
          updated_at: string
          reviewed_at: string | null
          reviewer_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['checkins']['Row'], 'updated_at' | 'reviewed_at' | 'reviewer_id'> & {
          reviewed_at?: string | null
          reviewer_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>
      }
      photos: {
        Row: {
          id: string
          participant_id: string
          date: string
          storage_path: string
          public_url: string
          size_bytes: number | null
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'uploaded_at'> & {
          id?: string
          uploaded_at?: string
        }
        Update: Partial<Database['public']['Tables']['photos']['Insert']>
      }
      exercise_proofs: {
        Row: {
          id: string
          participant_id: string
          date: string
          kind: 'photo' | 'note'
          note: string | null
          storage_path: string | null
          public_url: string | null
          size_bytes: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exercise_proofs']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['exercise_proofs']['Insert']>
      }
      admin_audit_log: {
        Row: {
          id: string
          actor_user_id: string
          action: string
          target_table: string
          target_id: string
          before: Json | null
          after: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id: string
          action: string
          target_table: string
          target_id: string
          before?: Json | null
          after?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['admin_audit_log']['Insert']>
      }
      challenge_settings: {
        Row: {
          id: 1
          start_date: string
          test_mode: boolean
          updated_at: string
        }
        Insert: { id?: 1, start_date?: string, test_mode?: boolean }
        Update: Partial<Database['public']['Tables']['challenge_settings']['Insert']>
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          id: string
          user_id: string
          name: string
          gender: 'M' | 'F'
          start_weight: number
          measure_count: number
          start_fat: number | null
          start_muscle: number | null
          workout_days: number
          diet_days: number
          photo_days: number
          total_photos: number
        }
      }
    }
    Functions: {
      register_participant: {
        Args: {
          p_name: string
          p_gender: 'M' | 'F'
          p_age: number | null
          p_height: number | null
          p_start_weight: number
          p_start_fat: number
          p_start_muscle: number
        }
        Returns: Database['public']['Tables']['participants']['Row']
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
