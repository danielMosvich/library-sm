// import { useProductStore } from "../../app/store/product/useProductStore";
import { generateUniqueSKU } from "../../utils/generateSku";

// import generateUniqueSKU from "../../utils/generateSku";
interface ProductBase {
  name: string;
  brand: string;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  tags: string | null;
}
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
export function CreateProduct(productBase: ProductBase, variants: Variant[]) {
  //   CREATING REST OF THE PRODUCT
  const productBaseForSupabase = {
    ...productBase,
    state: "active",
    variant: variants.length > 1,
    active: true,
    tags: productBase.tags
      ? productBase.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : null,
  };
  const productVariantsForSupabase = variants.map((variant) => ({
    ...variant,
    sku: generateUniqueSKU(productBase.name, variant.unit, productBase.brand),
    currency: "PEN",
    active: true,
  }));
  console.log({ productBaseForSupabase, productVariantsForSupabase });
  // return { productBaseForSupabase, productVariants };
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
export default CreateProduct;
