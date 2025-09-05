import { useState } from "react";
import ProductAddHeader from "../components/productAdd/header";
import ProductAddForm from "../components/productAdd/form";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";

export default function ProductAdd() {
  const [aiOptionsEnabled, setAiOptionsEnabled] = useState(true);
  const [defaultPricesEnabled, setDefaultPricesEnabled] = useState(true);
  useBreadcrumbs([
    { label: "Productos", href: "/products" },
    { label: "Agregar Producto", href: "/products/add" },
  ]);
  return (
    <div className="bg-base-100 pb-20 space-y-6">
      <ProductAddHeader
        aiOptionsEnabled={aiOptionsEnabled}
        setAiOptionsEnabled={setAiOptionsEnabled}
        defaultPricesEnabled={defaultPricesEnabled}
        setDefaultPricesEnabled={setDefaultPricesEnabled}
      />
      <ProductAddForm
        aiOptionsEnabled={aiOptionsEnabled}
        defaultPricesEnabled={defaultPricesEnabled}
      />
    </div>
  );
}
