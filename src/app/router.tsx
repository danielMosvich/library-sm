import { BrowserRouter, Routes, Route } from "react-router";
import Products from "../features/products/pages/Products";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductAdd from "../features/products/pages/ProductAdd";
import Inventory from "../features/inventory/page/Inventory";
import InventoryAdd from "../features/inventory/page/InventoryAdd";
export default function Router() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<ProductAdd />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/add" element={<InventoryAdd />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
