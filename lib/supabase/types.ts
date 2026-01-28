// Supabase Database Types for The Glass Eye Project

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
      photos: {
        Row: {
          id: string
          title: string | null
          description: string | null
          filename: string
          storage_key: string
          storage_url: string
          width: number | null
          height: number | null
          size: number | null
          mime_type: string | null
          is_public: boolean
          created_at: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          filename: string
          storage_key: string
          storage_url: string
          width?: number | null
          height?: number | null
          size?: number | null
          mime_type?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          filename?: string
          storage_key?: string
          storage_url?: string
          width?: number | null
          height?: number | null
          size?: number | null
          mime_type?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
      photo_tags: {
        Row: {
          id: string
          photo_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Photo = Database['public']['Tables']['photos']['Row']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']
export type PhotoUpdate = Database['public']['Tables']['photos']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']

export type PhotoTag = Database['public']['Tables']['photo_tags']['Row']

// Tag without created_at for API responses
export interface TagBasic {
  id: string
  name: string
  slug: string
}

// Extended types with relations
export interface PhotoWithTags extends Photo {
  tags: TagBasic[]
}
