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

export interface NewVariantData {
  variant_name: string;
  barcode?: string;
  sale_price: string;
  cost_price: string;
  image_url?: string;
  exchange_rate: number;
  currency: string;
  sku: string;
  hasInventory: boolean;
  inventoryStock: string;
  inventoryMinStock: string;
  inventoryLocationId: string;
  inventorySection: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface SimilarProduct {
  id: string;
  name: string;
  brand: string;
}
