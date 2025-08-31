import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  productsPageSize: number;
  setProductsPageSize: (size: number) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      productsPageSize: 5, // valor inicial
      setProductsPageSize: (size) => set({ productsPageSize: size }),
    }),
    {
      name: "ui-store", // clave en localStorage
      partialize: (state) => ({ productsPageSize: state.productsPageSize }),
    }
  )
);
