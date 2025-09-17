import generateUniqueSKU from "../../utils/generateSku";

interface ProductBase {
  name: string;
  brand: string;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  tags: string | null;
}
interface Variant {
  id?: string;
  unit: string;
  barcode: string | null;
  image_url: string | null;
  cost_price: number;
  sale_price: number;
}
function CreateProduct(productBase: ProductBase, variants: Variant[]) {
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
  const productVariants = variants.map((variant) => ({
    ...variant,
    sku: generateUniqueSKU(productBase.name, variant.unit, productBase.brand),
    currency: "USD",
    exchange_rate: 1,
    active: true,
  }));
  return { productBaseForSupabase, productVariants };
}
export default CreateProduct;
