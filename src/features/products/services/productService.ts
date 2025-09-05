import supabase from "../../../supabase/config";
import type { TablesInsert } from "../../../../database.types";
import type {
  ProductFormData,
  VariantFormData,
  Category,
  Location,
  SimilarProduct,
} from "../types/product";

export class ProductService {
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error al obtener categorías:", error);
      return [];
    }
    return data || [];
  }

  static async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error al obtener ubicaciones:", error);
      return [];
    }
    return data || [];
  }

  static async getProductById(id: string) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        `
        *,
        product_variants (
          id,
          variant_name,
          barcode,
          sale_price,
          cost_price,
          image_url,
          exchange_rate,
          sku,
          currency,
          active
        )
      `
      )
      .eq("id", id)
      .single();

    if (productError) {
      throw new Error("Error al obtener el producto");
    }

    return product;
  }

  static async updateProduct(id: string, data: ProductFormData) {
    const { variants, tags, ...productData } = data;

    // Verificar que el slug sea único (excluyendo el producto actual)
    if (productData.slug) {
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("slug", productData.slug)
        .neq("id", id)
        .single();

      if (existingProduct) {
        throw new Error("Ya existe un producto con ese slug");
      }
    }

    const processedProduct = {
      ...productData,
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : null,
      category_id: productData.category_id || null,
      variant: variants.length > 1,
      updated_at: new Date().toISOString(),
    };

    const { error: productError } = await supabase
      .from("products")
      .update(processedProduct)
      .eq("id", id);

    if (productError) {
      throw new Error("Error al actualizar el producto");
    }

    return { success: true };
  }

  static async updateVariants(productId: string, variants: VariantFormData[]) {
    // Primero desactivamos todas las variantes existentes
    await supabase
      .from("product_variants")
      .update({ active: false })
      .eq("base_product_id", productId);

    // Luego procesamos las variantes nuevas/actualizadas
    for (const variant of variants) {
      const variantData = {
        variant_name: variant.variant_name,
        barcode: variant.barcode || null,
        sale_price: variant.sale_price,
        cost_price: variant.cost_price,
        image_url: variant.image_url || null,
        exchange_rate: variant.exchange_rate,
        sku: variant.sku,
        currency: variant.currency || null,
        active: true,
        base_product_id: productId,
      };

      // Si existe el SKU, actualizamos; si no, creamos nuevo
      const { error } = await supabase
        .from("product_variants")
        .upsert(variantData, { onConflict: "sku" });

      if (error) {
        throw new Error(`Error al actualizar variante ${variant.sku}`);
      }
    }

    return { success: true };
  }

  static async searchSimilarProducts(name: string): Promise<SimilarProduct[]> {
    if (!name.trim() || name.trim().length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, name, brand")
      .or(`name.ilike.%${name.trim()}%,brand.ilike.%${name.trim()}%`)
      .limit(5);

    if (error) {
      console.error("Error buscando productos similares:", error);
      return [];
    }

    return data || [];
  }

  static async createProduct(data: ProductFormData) {
    const { variants, tags, ...productData } = data;

    const processedProduct: TablesInsert<"products"> = {
      ...productData,
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : null,
      category_id: productData.category_id || null,
      variant: variants.length > 1,
      active: true,
      state: "active",
    };

    const { data: productResult, error: productError } = await supabase
      .from("products")
      .insert([processedProduct])
      .select("id")
      .single();

    if (productError) {
      throw new Error("Error al crear el producto");
    }

    return productResult;
  }

  static async createVariants(productId: string, variants: VariantFormData[]) {
    const processedVariants: TablesInsert<"product_variants">[] = variants.map(
      (variant) => ({
        variant_name: variant.variant_name,
        barcode: variant.barcode || null,
        sale_price: variant.sale_price,
        cost_price: variant.cost_price,
        image_url: variant.image_url || null,
        exchange_rate: variant.exchange_rate,
        sku: variant.sku,
        currency: variant.currency || null,
        active: true,
        base_product_id: productId,
      })
    );

    const { data: variantsResult, error: variantsError } = await supabase
      .from("product_variants")
      .insert(processedVariants)
      .select("id, sku");

    if (variantsError) {
      throw new Error("Error al crear las variantes del producto");
    }

    return variantsResult;
  }

  static async createInventory(inventoryRecords: TablesInsert<"inventory">[]) {
    if (inventoryRecords.length === 0) return [];

    const { error: inventoryError } = await supabase
      .from("inventory")
      .insert(inventoryRecords);

    if (inventoryError) {
      throw new Error("Error al crear el inventario");
    }

    return inventoryRecords;
  }
}
