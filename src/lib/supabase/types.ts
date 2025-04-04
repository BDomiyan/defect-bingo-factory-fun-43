export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          password?: string
          role: string
          epf_number: string
          employee_id?: string
          plant_id?: string
          line_number?: string
          avatar_url?: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          password?: string
          role?: string
          epf_number: string
          employee_id?: string
          plant_id?: string
          line_number?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          password?: string
          role?: string
          epf_number?: string
          employee_id?: string
          plant_id?: string
          line_number?: string
          avatar_url?: string
        }
      }
      plants: {
        Row: {
          id: string
          created_at: string
          name: string
          lines: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          lines?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          lines?: string[]
        }
      }
      operations: {
        Row: {
          id: string
          created_at: string
          name: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
        }
      }
      defects: {
        Row: {
          id: string
          created_at: string
          garment_part: string
          defect_type: string
          validated: boolean
          validated_by?: string
          validated_at?: string
          created_by: string
          factory_id: string
          line_number: string
          epf_number?: string
          operation?: string
          supervisor_comment?: string
        }
        Insert: {
          id?: string
          created_at?: string
          garment_part: string
          defect_type: string
          validated?: boolean
          validated_by?: string
          validated_at?: string
          created_by: string
          factory_id: string
          line_number: string
          epf_number?: string
          operation?: string
          supervisor_comment?: string
        }
        Update: {
          id?: string
          created_at?: string
          garment_part?: string
          defect_type?: string
          validated?: boolean
          validated_by?: string
          validated_at?: string
          created_by?: string
          factory_id?: string
          line_number?: string
          epf_number?: string
          operation?: string
          supervisor_comment?: string
        }
      }
      bingo_cards: {
        Row: {
          id: string
          created_at: string
          user_id: string
          completed: boolean
          completed_at?: string
          score: number
          board_state?: object
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          completed?: boolean
          completed_at?: string
          score?: number
          board_state?: object
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          completed?: boolean
          completed_at?: string
          score?: number
          board_state?: object
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 