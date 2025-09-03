import { BrowserRouter, Routes, Route } from "react-router";
import Products from "../features/products/pages/Products";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductAdd from "../features/products/pages/ProductAdd";
import Inventory from "../features/inventory/page/Inventory";
import InventoryAdd from "../features/inventory/page/InventoryAdd";
import Categories from "../features/categories/Categories";
import CategoryAdd from "../features/categories/CategoryAdd";
import CategoryEdit from "../features/categories/CategoryEdit";
import CategoryView from "../features/categories/CategoryView";
import MainLayout from "../layout/main";
import Home from "../features/home/pages/Home";
export default function Router() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<ProductAdd />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/add" element={<InventoryAdd />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/add" element={<CategoryAdd />} />
            <Route path="/categories/:id" element={<CategoryView />} />
            <Route path="/categories/:id/edit" element={<CategoryEdit />} />
            <Route
              path="/categories/:id/subcategories/:subId"
              element={<CategoryView />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
