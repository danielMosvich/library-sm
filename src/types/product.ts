export interface ProductFormData {
  name: string;
  brand: string;
  category_id?: string;
  description?: string;
  image_url?: string;
  tags: string;
  slug: string;
  variants: VariantFormData[];
}

export interface VariantFormData {
  variant_name: string;
  barcode?: string;
  sale_price: number;
  cost_price: number;
  image_url?: string;
  exchange_rate: number;
  sku: string;
  currency: string;
}
