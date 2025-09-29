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

  hasInventory: boolean;
  stock: number;
  min_stock: number;
  location_id: string | null;
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
  if (!variants.find((v) => v.exchange_rate === 1)) {
    return returnError("Debe haber al menos una variante con tasa de cambio 1");
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
  const inventoryRecords = [];
  for (const variant of variants) {
    if (variant.hasInventory && variant.location_id) {
      const variantSku = skusMap.get(variant.idx);
      const variantId = skuToVariantId.get(variantSku);

      if (variantId) {
        inventoryRecords.push({
          product_variant_id: variantId,
          stock: variant.stock,
          min_stock: variant.min_stock,
          location_id: variant.location_id,
          section: variant.section,
          status: "active",
        });
      }
    }
  }

  // Insertar registros de inventario si hay alguno
  if (inventoryRecords.length > 0) {
    const { error: inventoryError } = await supabase
      .from("inventory")
      .insert(inventoryRecords);

    if (inventoryError) {
      return returnError(
        "Error al crear los registros de inventario: " + inventoryError.message
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
    hasInventory: variant.hasInventory,
    stock: Number(variant.hasInventory) ? variant.stock : 0,
    min_stock: Number(variant.hasInventory) ? variant.min_stock : 0,
    location_id: variant.location_id || null,
    section: variant.section || null,
  };
  return {
    ok: true,
    message: "Variante agregada",
    variant: newVariant,
  };
}
// export default CreateProduct;
