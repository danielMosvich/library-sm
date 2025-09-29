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
  removeVariant: (id: number) => void;

  // EDIT VARIANT
  currentEditVariant: ProductVariant | null;
  setCurrentEditVariant: (variant: ProductVariant | null) => void;
  updateVariant: (variant: ProductVariant) => void;
  modalMode: "create" | "edit";
  changeModalMode: (mode: "create" | "edit") => void;

  // reset all
  resetStore: () => void;

  // isLoading mutation
  setIsLoading: (loading: boolean) => void;
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
        currentEditVariant: null,
        modalMode: "create",

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
        removeVariant: (id: number) =>
          set((state) => ({
            variants: state.variants.filter((v) => v.idx !== id),
          })),

        // EDIT VARIANT
        changeModalMode: (mode: "create" | "edit") =>
          set(() => ({ modalMode: mode })),
        setCurrentEditVariant: (variant: ProductVariant | null) =>
          set(() => ({ currentEditVariant: variant })),
        updateVariant: (variant: ProductVariant) =>
          set((state) => ({
            variants: state.variants.map((v) =>
              v.idx === variant.idx ? variant : v
            ),
          })),
        // reset all
        resetStore: () =>
          set(() => ({
            variants: [],
            isLoading: false,
            currentEditVariant: null,
            modalMode: "create",
          })),
        setIsLoading: (loading: boolean) => set(() => ({ isLoading: loading })),
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
