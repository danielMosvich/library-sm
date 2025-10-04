// import { useProductStore } from "../../app/store/product/useProductStore";
import supabase from "../../supabase/config";
import { generateUniqueSKUsBatch } from "../../utils/generateSku";

// import generateUniqueSKU from "../../utils/generateSku";
// interface ProductBase {
//   name: string;
//   brand: string;
//   category_id: string | null;
//   description: string | null;
//   image_url: string | null;
//   tags: string | null;
// }
interface CreateVariant {
  idx: number;
  image_url: string | null;
  unit: string;
  exchange_rate: number;
  color_id?: number | null;
  barcode: string | null;
  cost_price: number;
  sale_price: number;

  stock?: number;
  min_stock: number;
  location_id: string;
  section: string | null;
}
interface CreateProduct {
  image_url: string | null;
  name: string;
  brand: string;
  category_id: string | null;
  description: string | null;
  tags: string | null;
}
function returnError(message: string) {
  return {
    ok: false,
    message,
  };
}
export async function CreateProduct(
  product: CreateProduct,
  variants: CreateVariant[]
) {
  if (product.name.trim().length === 0) {
    return returnError("El nombre del producto no puede estar vacío");
  }
  if (product.brand.trim().length === 0) {
    return returnError("La marca del producto no puede estar vacía");
  }
  if (variants.length === 0) {
    return returnError("Debe agregar al menos una variante al producto");
  }
  if (!variants.find((v) => v.exchange_rate === 1)) {
    return returnError("Debe haber un producto con la unidad minima (1)");
  }

  // Generar todos los SKUs de forma optimizada
  const skusMap = await generateUniqueSKUsBatch(
    variants,
    product.name,
    product.brand
  );

  const productForSupabase = {
    baseProduct: {
      name: product.name.trim(),
      brand: product.brand.trim(),
      category_id: product.category_id || null,
      description: product.description ? product.description.trim() : null,
      image_url: product.image_url?.trim() || null,
      tags: product.tags
        ? product.tags.split(",").map((tag) => tag.trim())
        : null,
    },
    variants: variants.map((v) => ({
      sku: skusMap.get(v.idx), // Usar SKU basado en idx
      barcode: v.barcode || null,
      cost_price: v.cost_price,
      sale_price: v.sale_price,
      image_url: v.image_url || null,
      unit: v.unit,
      exchange_rate: v.exchange_rate,
      color_id: v.color_id || null,
      base_product_id: null,
      currency: "PEN",
      active: true,
      size_id: null,
      material_id: null,
    })),
  };
  // console.log(productForSupabase.baseProduct);
  // return;
  const { data, error } = await supabase
    .from("products")
    .insert(productForSupabase.baseProduct)
    .select("id")
    .maybeSingle();
  if (error) {
    return returnError("Error al crear el producto base: " + error.message);
  }
  const productId = data?.id;
  if (!productId) {
    return returnError("No se obtuvo el ID del producto creado");
  }
  // Insertar variantes con el ID del producto creado y obtener los IDs generados junto con sus SKUs
  const { data: variantsData, error: variantsError } = await supabase
    .from("product_variants")
    .insert(
      productForSupabase.variants.map((variant) => ({
        ...variant,
        base_product_id: productId,
      }))
    )
    .select("id, sku");

  if (variantsError) {
    return returnError(
      "Error al crear las variantes: " + variantsError.message
    );
  }

  if (!variantsData || variantsData.length === 0) {
    return returnError("No se obtuvieron los IDs de las variantes creadas");
  }

  // Crear un mapa de SKU a variant_id para hacer la correspondencia correcta
  const skuToVariantId = new Map();
  variantsData.forEach((variantData) => {
    skuToVariantId.set(variantData.sku, variantData.id);
  });

  // Crear registros de inventario para variantes que tengan hasInventory: true
  const stock_config_items = [];
  const stock_movement_items = [];
  for (const variant of variants) {
    // CRÍTICO: location_id es el ancla para la gestión y configuración
    if (variant.location_id) {
      const variantSku = skusMap.get(variant.idx);
      const variantId = skuToVariantId.get(variantSku);

      if (variantId) {
        // 1. CREACIÓN DE CONFIGURACIÓN (stock_config): SE HACE PARA CUALQUIER VARIANTE CON UBICACIÓN.
        // Esto asegura que tengas reglas (min_stock, section) para la Unidad, la Caja, el Paquete, etc.
        stock_config_items.push({
          product_variant_id: variantId,
          location_id: variant.location_id,
          min_stock: variant.min_stock,
          section: variant.section,
          status: "active",
        });

        // 2. CREACIÓN DE MOVIMIENTO INICIAL (stock_movements): SOLO SI HAY STOCK > 0
        if (variant.stock && variant.stock > 0) {
          // !!! CORRECCIÓN CRÍTICA: Multiplicar el stock ingresado por el factor de conversión !!!
          // Esto convierte "10 Cajas" a "60 Unidades Base".
          const baseQuantity = variant.stock * variant.exchange_rate;

          stock_movement_items.push({
            product_variant_id: variantId,
            location_id: variant.location_id,
            // La cantidad SIEMPRE se registra en la Unidad Base (exchange_rate=1)
            quantity: baseQuantity,
            reason: "INVENTARIO_INICIAL",
            movement_type: "IN",
            document_ref: "CREACION_PRODUCTO",
          });
        }
      }
    }
  }

  // Insertar registros de inventario si hay alguno
  if (stock_config_items.length > 0) {
    const { error: stockConfigError } = await supabase
      .from("stock_config")
      .insert(stock_config_items);

    if (stockConfigError) {
      return returnError(
        "Error al crear los registros de inventario: " +
          stockConfigError.message
      );
    }
  }

  if (stock_movement_items.length > 0) {
    const { error: stockMovementError } = await supabase
      .from("stock_movements")
      .insert(stock_movement_items);
    if (stockMovementError) {
      return returnError(
        "Error al crear los movimientos de inventario: " +
          stockMovementError.message
      );
    }
  }

  return {
    ok: true,
    message: "Producto, variantes e inventario creados correctamente",
  };
}
export function CreateVariant(variant: CreateVariant): {
  ok: boolean;
  message: string;
  variant: CreateVariant;
} {
  const newVariant = {
    idx: variant.idx,
    unit: variant.unit,
    exchange_rate: variant.exchange_rate,
    color_id: variant.color_id || null,
    image_url: variant.image_url || null,
    barcode: variant.barcode || null,
    cost_price: variant.cost_price,
    sale_price: variant.sale_price,
    stock: variant.stock || 0,
    min_stock: variant.min_stock || 1,
    location_id: variant.location_id,
    section: variant.section || null,
  };
  console.log(newVariant);
  return {
    ok: true,
    message: "Variante agregada",
    variant: newVariant,
  };
}
// export default CreateProduct;
