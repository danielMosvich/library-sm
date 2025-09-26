import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Estado del store
interface ProductState {
  variants: ProductVariant[];
  aiOptionsEnabled: boolean;
  defaultPricesEnabled: boolean;
  isLoading: boolean;
  toggleAiOptions: () => void;
  toggleDefaultPrices: () => void;
  addVariant: (variant: ProductVariant) => void;
  // removeVariant: (id: string) => void;
}
interface ProductVariant {
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
// Store de productos
export const useProductStore = create<ProductState>()(
  devtools(
    persist(
      (set) => ({
        // Estado inicial
        variants: [],
        aiOptionsEnabled: true,
        defaultPricesEnabled: false,
        isLoading: false,

        //*ACTIONS ABOUT SETTINGS
        toggleAiOptions: () =>
          set((state) => ({ aiOptionsEnabled: !state.aiOptionsEnabled })),
        toggleDefaultPrices: () =>
          set((state) => ({
            defaultPricesEnabled: !state.defaultPricesEnabled,
          })),

        //?ACTIONS ABOUT VARIANTS
        addVariant: (variant: ProductVariant) =>
          set((state) => ({ variants: [...state.variants, variant] })),
        // removeVariant: (idx: number) =>
        //   set((state) => ({
        //     variants: state.variants.filter((variant) => variant.idx !== id),
        //   })),
      }),
      {
        name: "product-settings",
        partialize: (state) => ({
          aiOptionsEnabled: state.aiOptionsEnabled,
          defaultPricesEnabled: state.defaultPricesEnabled,
        }),
      }
    ),
    {
      name: "product-store",
    }
  )
);
