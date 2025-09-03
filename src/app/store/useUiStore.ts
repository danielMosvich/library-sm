import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string | React.ReactNode;
}

interface UiState {
  productsPageSize: number;
  isSidebarOpen: boolean;
  breadcrumbs: BreadcrumbItem[];
  setProductsPageSize: (size: number) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleIsSidebarOpen: () => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      productsPageSize: 5, // valor inicial
      isSidebarOpen: true,
      breadcrumbs: [],
      setProductsPageSize: (size) => set({ productsPageSize: size }),
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleIsSidebarOpen: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      addBreadcrumb: (breadcrumb) =>
        set((state) => ({ breadcrumbs: [...state.breadcrumbs, breadcrumb] })),
      clearBreadcrumbs: () => set({ breadcrumbs: [] }),
    }),
    {
      name: "ui-store", // clave en localStorage
      partialize: (state) => ({
        productsPageSize: state.productsPageSize,
        isSidebarOpen: state.isSidebarOpen,
        // No persistimos breadcrumbs porque son específicos de la sesión
      }),
    }
  )
);
