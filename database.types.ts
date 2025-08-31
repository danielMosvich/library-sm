export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean;
          atributes: Json | null;
          created_at: string | null;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          parent_id: string | null;
          tags: string[] | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          atributes?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          parent_id?: string | null;
          tags?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          atributes?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          parent_id?: string | null;
          tags?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory: {
        Row: {
          created_at: string;
          id: string;
          location_id: string;
          min_stock: number;
          product_variant_id: string;
          section: string | null;
          status: string | null;
          stock: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          location_id?: string;
          min_stock?: number;
          product_variant_id?: string;
          section?: string | null;
          status?: string | null;
          stock?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          location_id?: string;
          min_stock?: number;
          product_variant_id?: string;
          section?: string | null;
          status?: string | null;
          stock?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      locations: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          layout: Json | null;
          name: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          layout?: Json | null;
          name: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          layout?: Json | null;
          name?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          active: boolean;
          barcode: string | null;
          base_product_id: string;
          cost_price: number;
          created_at: string;
          created_by: string | null;
          currency: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          exchange_rate: number;
          id: string;
          image_url: string | null;
          sale_price: number;
          sku: string;
          updated_at: string;
          updated_by: string | null;
          variant_name: string;
        };
        Insert: {
          active?: boolean;
          barcode?: string | null;
          base_product_id?: string;
          cost_price?: number;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exchange_rate?: number;
          id?: string;
          image_url?: string | null;
          sale_price?: number;
          sku: string;
          updated_at?: string;
          updated_by?: string | null;
          variant_name: string;
        };
        Update: {
          active?: boolean;
          barcode?: string | null;
          base_product_id?: string;
          cost_price?: number;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exchange_rate?: number;
          id?: string;
          image_url?: string | null;
          sale_price?: number;
          sku?: string;
          updated_at?: string;
          updated_by?: string | null;
          variant_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "produc_variants_base_product_id_fkey";
            columns: ["base_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          active: boolean | null;
          brand: string;
          category_id: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          slug: string;
          state: string | null;
          tags: string[] | null;
          updated_at: string;
          updated_by: string | null;
          variant: boolean;
        };
        Insert: {
          active?: boolean | null;
          brand: string;
          category_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          slug: string;
          state?: string | null;
          tags?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
          variant?: boolean;
        };
        Update: {
          active?: boolean | null;
          brand?: string;
          category_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          slug?: string;
          state?: string | null;
          tags?: string[] | null;
          updated_at?: string;
          updated_by?: string | null;
          variant?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
