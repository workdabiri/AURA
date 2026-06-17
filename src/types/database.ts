export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          description: Json
          id: string
          image_url: string | null
          is_active: boolean
          name: Json
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: Json
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string | null
          after_snapshot: Json | null
          before_snapshot: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_role: string
          actor_user_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string | null
          after_snapshot?: Json | null
          before_snapshot?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string | null
          id: string
          language: string
          message: string | null
          name: string
          notes: string | null
          phone: string
          preferred_contact_method: Database["public"]["Enums"]["preferred_contact_method"]
          priority: Database["public"]["Enums"]["lead_priority"]
          property_id: string | null
          selected_area: string | null
          selected_bedrooms: string | null
          selected_budget: string | null
          selected_goal: string | null
          selected_property_type: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"]
          priority?: Database["public"]["Enums"]["lead_priority"]
          property_id?: string | null
          selected_area?: string | null
          selected_bedrooms?: string | null
          selected_budget?: string | null
          selected_goal?: string | null
          selected_property_type?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          preferred_contact_method?: Database["public"]["Enums"]["preferred_contact_method"]
          priority?: Database["public"]["Enums"]["lead_priority"]
          property_id?: string | null
          selected_area?: string | null
          selected_bedrooms?: string | null
          selected_budget?: string | null
          selected_goal?: string | null
          selected_property_type?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: Json
          created_at: string
          effective_date: string
          id: string
          last_updated_by: string | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["legal_page_status"]
          title: Json
          updated_at: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          effective_date: string
          id?: string
          last_updated_by?: string | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["legal_page_status"]
          title?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          effective_date?: string
          id?: string
          last_updated_by?: string | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["legal_page_status"]
          title?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "legal_pages_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          agent_whatsapp: string | null
          amenities: Json
          archived_at: string | null
          area_id: string | null
          availability_status: Database["public"]["Enums"]["availability_status"]
          bathrooms: number | null
          bedrooms: number | null
          building_name: string | null
          community: string | null
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          currency: string
          description: Json
          developer_name: string | null
          down_payment_amount: number | null
          external_map_url: string | null
          furnishing_status: Database["public"]["Enums"]["furnishing_status"]
          handover_date: string | null
          id: string
          is_featured: boolean
          location_label: string
          market_type: Database["public"]["Enums"]["market_type"]
          parking: number | null
          payment_plan_summary: string | null
          permit_number: string | null
          price: number | null
          price_visibility: Database["public"]["Enums"]["price_visibility"]
          property_type: Database["public"]["Enums"]["property_type"]
          publish_status: Database["public"]["Enums"]["publish_status"]
          published_at: string | null
          reference_number: string
          rental_period: Database["public"]["Enums"]["rental_period"] | null
          rera_number: string | null
          size_sqft: number
          size_sqm: number | null
          slug: string
          sub_community: string | null
          title: Json
          title_en: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          updated_by: string | null
          views_count: number | null
        }
        Insert: {
          address?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          agent_whatsapp?: string | null
          amenities?: Json
          archived_at?: string | null
          area_id?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: Json
          developer_name?: string | null
          down_payment_amount?: number | null
          external_map_url?: string | null
          furnishing_status?: Database["public"]["Enums"]["furnishing_status"]
          handover_date?: string | null
          id?: string
          is_featured?: boolean
          location_label: string
          market_type: Database["public"]["Enums"]["market_type"]
          parking?: number | null
          payment_plan_summary?: string | null
          permit_number?: string | null
          price?: number | null
          price_visibility?: Database["public"]["Enums"]["price_visibility"]
          property_type: Database["public"]["Enums"]["property_type"]
          publish_status?: Database["public"]["Enums"]["publish_status"]
          published_at?: string | null
          reference_number: string
          rental_period?: Database["public"]["Enums"]["rental_period"] | null
          rera_number?: string | null
          size_sqft: number
          size_sqm?: number | null
          slug: string
          sub_community?: string | null
          title?: Json
          title_en?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          updated_by?: string | null
          views_count?: number | null
        }
        Update: {
          address?: string | null
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          agent_whatsapp?: string | null
          amenities?: Json
          archived_at?: string | null
          area_id?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status"]
          bathrooms?: number | null
          bedrooms?: number | null
          building_name?: string | null
          community?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: Json
          developer_name?: string | null
          down_payment_amount?: number | null
          external_map_url?: string | null
          furnishing_status?: Database["public"]["Enums"]["furnishing_status"]
          handover_date?: string | null
          id?: string
          is_featured?: boolean
          location_label?: string
          market_type?: Database["public"]["Enums"]["market_type"]
          parking?: number | null
          payment_plan_summary?: string | null
          permit_number?: string | null
          price?: number | null
          price_visibility?: Database["public"]["Enums"]["price_visibility"]
          property_type?: Database["public"]["Enums"]["property_type"]
          publish_status?: Database["public"]["Enums"]["publish_status"]
          published_at?: string | null
          reference_number?: string
          rental_period?: Database["public"]["Enums"]["rental_period"] | null
          rera_number?: string | null
          size_sqft?: number
          size_sqm?: number | null
          slug?: string
          sub_community?: string | null
          title?: Json
          title_en?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          updated_by?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_media: {
        Row: {
          alt_text: string
          created_at: string
          height: number | null
          id: string
          is_cover: boolean
          media_type: Database["public"]["Enums"]["property_media_type"]
          order_index: number
          property_id: string
          size_bytes: number
          storage_path: string
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          media_type: Database["public"]["Enums"]["property_media_type"]
          order_index?: number
          property_id: string
          size_bytes: number
          storage_path: string
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          media_type?: Database["public"]["Enums"]["property_media_type"]
          order_index?: number
          property_id?: string
          size_bytes?: number
          storage_path?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_stakeholders: {
        Row: {
          created_at: string
          email: string | null
          id: string
          internal_notes: string | null
          name: string
          phone: string | null
          property_id: string
          registration_or_license: string | null
          type: Database["public"]["Enums"]["stakeholder_type"]
          updated_at: string
          visibility: Database["public"]["Enums"]["stakeholder_visibility"]
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          name: string
          phone?: string | null
          property_id: string
          registration_or_license?: string | null
          type: Database["public"]["Enums"]["stakeholder_type"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["stakeholder_visibility"]
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          name?: string
          phone?: string | null
          property_id?: string
          registration_or_license?: string | null
          type?: Database["public"]["Enums"]["stakeholder_type"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["stakeholder_visibility"]
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_stakeholders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          expires_at: string
          key_hash: string
          route: string
          window_start: string
        }
        Insert: {
          count?: number
          expires_at: string
          key_hash: string
          route: string
          window_start?: string
        }
        Update: {
          count?: number
          expires_at?: string
          key_hash?: string
          route?: string
          window_start?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_clicks: {
        Row: {
          created_at: string
          id: string
          language: string | null
          property_id: string | null
          selected_area: string | null
          selected_bedrooms: string | null
          selected_budget: string | null
          selected_goal: string | null
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          property_id?: string | null
          selected_area?: string | null
          selected_bedrooms?: string | null
          selected_budget?: string | null
          selected_goal?: string | null
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          property_id?: string | null
          selected_area?: string | null
          selected_bedrooms?: string | null
          selected_budget?: string | null
          selected_goal?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_clicks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      availability_status:
        | "available"
        | "reserved"
        | "sold"
        | "rented"
        | "unavailable"
      furnishing_status:
        | "furnished"
        | "semi_furnished"
        | "unfurnished"
        | "unknown"
      lead_priority: "low" | "normal" | "high"
      lead_source:
        | "homepage"
        | "listing"
        | "property_detail"
        | "contact_page"
        | "whatsapp_cta"
        | "sales_demo"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "won"
        | "lost"
        | "archived"
      legal_page_status: "draft" | "published" | "archived"
      market_type: "ready" | "off_plan"
      preferred_contact_method: "phone" | "whatsapp" | "email"
      price_visibility: "visible" | "price_on_application"
      property_media_type: "image" | "floorplan"
      property_type:
        | "apartment"
        | "villa"
        | "townhouse"
        | "penthouse"
        | "office"
        | "plot"
        | "retail"
        | "warehouse"
      publish_status: "draft" | "published" | "archived"
      rental_period: "yearly" | "monthly" | "weekly" | "daily"
      stakeholder_type:
        | "developer"
        | "owner"
        | "seller"
        | "landlord"
        | "sales_partner"
        | "exclusive_agent"
      stakeholder_visibility: "internal_only" | "public"
      transaction_type: "sale" | "rent"
      user_role: "super_admin" | "client_admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      availability_status: [
        "available",
        "reserved",
        "sold",
        "rented",
        "unavailable",
      ],
      furnishing_status: [
        "furnished",
        "semi_furnished",
        "unfurnished",
        "unknown",
      ],
      lead_priority: ["low", "normal", "high"],
      lead_source: [
        "homepage",
        "listing",
        "property_detail",
        "contact_page",
        "whatsapp_cta",
        "sales_demo",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "unqualified",
        "won",
        "lost",
        "archived",
      ],
      legal_page_status: ["draft", "published", "archived"],
      market_type: ["ready", "off_plan"],
      preferred_contact_method: ["phone", "whatsapp", "email"],
      price_visibility: ["visible", "price_on_application"],
      property_media_type: ["image", "floorplan"],
      property_type: [
        "apartment",
        "villa",
        "townhouse",
        "penthouse",
        "office",
        "plot",
        "retail",
        "warehouse",
      ],
      publish_status: ["draft", "published", "archived"],
      rental_period: ["yearly", "monthly", "weekly", "daily"],
      stakeholder_type: [
        "developer",
        "owner",
        "seller",
        "landlord",
        "sales_partner",
        "exclusive_agent",
      ],
      stakeholder_visibility: ["internal_only", "public"],
      transaction_type: ["sale", "rent"],
      user_role: ["super_admin", "client_admin"],
    },
  },
} as const

