export interface ProductFormData {
  name: string;
  brand: string;
  category_id: string;
  description?: string;
  image_url: string;
  tags: string;
  slug: string;
  variants: VariantsFormData[];
}
export interface VariantsFormData {
  unit: string;
  barcode?: string;
  sale_price: number;
  cost_price: number;
  image_url?: string;
  exchange_rate: number;
  color_id?: string;
  currency: string;
  sku: string;
  hasInventory: boolean;
  inventoryStock: string;
  inventoryMinStock: string;
  inventoryLocationId: string;
  inventorySection: string;
}
