export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "event-attendees": {
        Row: {
          event_id: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: number
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event-attendees_attendee_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event-attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      "event-picture-albums": {
        Row: {
          album_name: string | null
          created_at: string
          event_id: string | null
          id: string
          image_urls: Json | null
        }
        Insert: {
          album_name?: string | null
          created_at: string
          event_id?: string | null
          id?: string
          image_urls?: Json | null
        }
        Update: {
          album_name?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          image_urls?: Json | null
        }
        Relationships: []
      }
      "event-pictures": {
        Row: {
          event_id: string
          gallery_pictures: Json | null
          hero_picture_url: string | null
          id: string
        }
        Insert: {
          event_id: string
          gallery_pictures?: Json | null
          hero_picture_url?: string | null
          id?: string
        }
        Update: {
          event_id?: string
          gallery_pictures?: Json | null
          hero_picture_url?: string | null
          id?: string
        }
        Relationships: []
      }
      "event-tickets": {
        Row: {
          created_at: string
          event_address: string | null
          event_id: string | null
          event_starts_at: string | null
          event_title: string | null
          id: string
          ticket_price: string | null
          user_email: string | null
          user_fullname: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_address?: string | null
          event_id?: string | null
          event_starts_at?: string | null
          event_title?: string | null
          id?: string
          ticket_price?: string | null
          user_email?: string | null
          user_fullname?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          event_address?: string | null
          event_id?: string | null
          event_starts_at?: string | null
          event_title?: string | null
          id?: string
          ticket_price?: string | null
          user_email?: string | null
          user_fullname?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event-tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event-tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendees_limit: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          event_address: string | null
          event_description: Json | null
          event_group: string | null
          event_title: string | null
          event_topics: Json | null
          id: string
          starts_at: string | null
          ticket_price: string | null
        }
        Insert: {
          attendees_limit?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          event_address?: string | null
          event_description?: Json | null
          event_group?: string | null
          event_title?: string | null
          event_topics?: Json | null
          id?: string
          starts_at?: string | null
          ticket_price?: string | null
        }
        Update: {
          attendees_limit?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          event_address?: string | null
          event_description?: Json | null
          event_group?: string | null
          event_title?: string | null
          event_topics?: Json | null
          id?: string
          starts_at?: string | null
          ticket_price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_event_group_fkey"
            columns: ["event_group"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      "group-members": {
        Row: {
          group_id: string | null
          id: string
          joined_at: string
          member_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string
          member_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string
          member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group-members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group-members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "group-picture-albums": {
        Row: {
          album_name: string | null
          created_at: string | null
          group_id: string
          id: string
          image_urls: Json | null
        }
        Insert: {
          album_name?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          image_urls?: Json | null
        }
        Update: {
          album_name?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          image_urls?: Json | null
        }
        Relationships: []
      }
      "group-pictures": {
        Row: {
          gallery_pictures: Json | null
          group_id: string
          hero_picture_url: string | null
          id: string
        }
        Insert: {
          gallery_pictures?: Json | null
          group_id: string
          hero_picture_url?: string | null
          id?: string
        }
        Update: {
          gallery_pictures?: Json | null
          group_id?: string
          hero_picture_url?: string | null
          id?: string
        }
        Relationships: []
      }
      "group-posts": {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          post_content: Json | null
          post_title: string | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          post_content?: Json | null
          post_title?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          post_content?: Json | null
          post_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group-posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      "group-posts-comments": {
        Row: {
          comment_content: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_content?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_content?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group-posts-comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "group-posts-pictures": {
        Row: {
          created_at: string
          id: string
          image_urls: Json | null
          post_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_urls?: Json | null
          post_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_urls?: Json | null
          post_id?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          group_city: string | null
          group_country: string | null
          group_description: Json | null
          group_name: string | null
          group_owner: string | null
          group_topics: Json | null
          id: string
        }
        Insert: {
          created_at?: string
          group_city?: string | null
          group_country?: string | null
          group_description?: Json | null
          group_name?: string | null
          group_owner?: string | null
          group_topics?: Json | null
          id?: string
        }
        Update: {
          created_at?: string
          group_city?: string | null
          group_country?: string | null
          group_description?: Json | null
          group_name?: string | null
          group_owner?: string | null
          group_topics?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_group_owner_fkey"
            columns: ["group_owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          id: string
          interest_group: Json
        }
        Insert: {
          id?: string
          interest_group: Json
        }
        Update: {
          id?: string
          interest_group?: Json
        }
        Relationships: []
      }
      "post-comments": {
        Row: {
          comment_content: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_content?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_content?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post-comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "post-pictures": {
        Row: {
          created_at: string
          id: string
          image_urls: Json | null
          post_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_urls?: Json | null
          post_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_urls?: Json | null
          post_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          created_at: string
          id: string
          post_content: Json | null
          post_title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_content?: Json | null
          post_title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_content?: Json | null
          post_title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "profile-pictures": {
        Row: {
          id: number
          image_url: string
          user_id: string | null
        }
        Insert: {
          id?: number
          image_url: string
          user_id?: string | null
        }
        Update: {
          id?: number
          image_url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      "saved-events": {
        Row: {
          event_city: string | null
          event_date: string | null
          event_link: string | null
          event_name: string | null
          event_place: string | null
          event_time: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          event_city?: string | null
          event_date?: string | null
          event_link?: string | null
          event_name?: string | null
          event_place?: string | null
          event_time?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          event_city?: string | null
          event_date?: string | null
          event_link?: string | null
          event_name?: string | null
          event_place?: string | null
          event_time?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "stripe-products": {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          stripe_account_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string
          id?: string
          stripe_account_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          stripe_account_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_products_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      "stripe-sessions": {
        Row: {
          amount_total: number | null
          created_at: string | null
          currenct: string | null
          event_id: string | null
          id: string
          payment_intent_id: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_total?: number | null
          created_at?: string | null
          currenct?: string | null
          event_id?: string | null
          id?: string
          payment_intent_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          amount_total?: number | null
          created_at?: string | null
          currenct?: string | null
          event_id?: string | null
          id?: string
          payment_intent_id?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "stripe-users": {
        Row: {
          created_at: string | null
          is_active: boolean | null
          refund_policy: Json | null
          stripe_user_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_active?: boolean | null
          refund_policy?: Json | null
          stripe_user_id: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          is_active?: boolean | null
          refund_policy?: Json | null
          stripe_user_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe-users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          city: string | null
          country: string | null
          email: string | null
          full_name: string | null
          id: string
          joined_at: string
          social_media: Json | null
          user_bio: Json | null
          user_interests: Json | null
          user_role: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          joined_at?: string
          social_media?: Json | null
          user_bio?: Json | null
          user_interests?: Json | null
          user_role?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          joined_at?: string
          social_media?: Json | null
          user_bio?: Json | null
          user_interests?: Json | null
          user_role?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
