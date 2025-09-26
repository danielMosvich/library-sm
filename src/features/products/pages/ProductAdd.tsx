import ProductAddHeader from "../components/productAdd/header";
import ProductAddForm from "../components/productAdd/form";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";

export default function ProductAdd() {
  useBreadcrumbs([
    { label: "Productos", href: "/products" },
    { label: "Agregar Producto", href: "/products/add" },
  ]);
  return (
    <div className="bg-base-100 pb-20 space-y-6">
      <ProductAddHeader />
      <ProductAddForm />
    </div>
  );
}
