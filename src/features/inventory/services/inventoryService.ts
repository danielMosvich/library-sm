import supabase from "../../../supabase/config";

// ====================================================================
// INTERFACES
// ====================================================================

export interface InventoryItem {
  variant_id: string;
  base_product_id: string;
  product_name: string;
  brand: string;
  category_name: string | null;

  // ✨ IMÁGENES y CÓDIGOS (NUEVOS CAMPOS)
  base_product_image_url: string | null; // Imagen del Padre
  variant_image_url: string | null; // Imagen de la Variante
  sku: string;
  barcode: string | null; // Código de Barras

  // Precios y Unidades
  sale_price: number;
  cost_price: number;
  exchange_rate: number;
  unit_of_sale_name: string;
  color_name: string | null;
  active: boolean;

  // 📦 DATOS DE STOCK
  min_stock: number | null;
  section: string | null;
  location_name: string | null;
  current_stock_base: number | number;
  current_stock_sellable: number | number;
}

// ====================================================================
// FUNCIÓN DE FETCHING DE DATOS (CONSOLIDADA)
// ====================================================================

/**
 * Función para obtener datos de la vista consolidada de Supabase.
 */
export async function fetchConsolidatedInventory({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}): Promise<{ data: InventoryItem[]; total: number } | null> {
  const from = (page - 1) * pageSize; // Corregir cálculo de 'from' si 'page' empieza en 1
  const to = from + pageSize - 1;

  try {
    // Primera consulta: obtener datos y contar el total
    const query = supabase
      .from("inventory_consolidated_view")
      .select("*", { count: "exact" }) // Pedimos el conteo total
      .order("base_product_id", { ascending: false })
      .order("variant_id", { ascending: true })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching inventory:", error);
      return null;
    }

    // El conteo debe ser manejado por Supabase si se usa .select('*, { count: 'exact' })
    const total = count ?? 0;

    return { data: data as InventoryItem[], total };
  } catch (e) {
    console.error("Network error:", e);
    return null;
  }
}
