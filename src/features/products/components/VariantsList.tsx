import { useEffect, useState } from "react";
import supabase from "../../../supabase/config";
import type { Tables } from "../../../../database.types";
import { clsx } from "clsx";
type VariantsListProps = {
  productId: string;
  name: string;
  brand: string;
};

export default function VariantsList({
  productId,
  name,
  brand,
}: VariantsListProps) {
  const [variants, setVariants] = useState<Tables<"product_variants">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("base_product_id", productId);

      if (error) {
        console.error("Error al obtener variantes:", error);
      } else {
        setVariants(data || []);
      }
      setLoading(false);
    };

    fetchVariants();
  }, [productId]);

  if (loading) {
    return (
      <div className="p-2">
        <div className="skeleton h-10 w-full"></div>
      </div>
    );
  }

  if (variants.length === 0) {
    return <p>No hay variantes para este producto.</p>;
  }

  return (
    <ul className="pl-5">
      {variants.map((variant, index) => (
        <li
          key={variant.id}
          className="border-2 min-w-fit w-auto border-base-content/20 border-t-0 flex gap-4 items-center relative pl-5"
        >
          <div className="kbd bg-base-100 font-black absolute -left-3">
            {index + 1}
          </div>
          <div className="w-12 h-12 min-w-12 min-h-12 md:w-12 md:h-12 md:min-h-12 md:min-w-12 overflow-hidden bg-white rounded-box">
            <img
              className="w-full h-full object-cover"
              src={
                variant.image_url ? variant.image_url : "/images/no-image.webp"
              }
              alt={variant.variant_name}
            />
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Nombre de variante</p>
            <div className="whitespace-nowrap overflow-ellipsis line-clamp-1">
              {name}{" "}
              <b className="text-primary-content">{variant.variant_name}</b>
            </div>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Marca</p>
            <div className="whitespace-nowrap overflow-ellipsis line-clamp-1 badge badge-soft badge-info font-semibold">
              {brand}
            </div>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Código</p>
            <div className="kbd">
              {variant.barcode ? variant.barcode : "N/A"}
            </div>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">SKU</p>
            <div className="kbd line-clamp-1">{variant.sku}</div>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Precio de compra</p>
            <div className="whitespace-nowrap overflow-ellipsis line-clamp-1 text-center font-black text-success">
              s/ {variant.cost_price.toFixed(2)}
            </div>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Precio de venta</p>
            <p className="whitespace-nowrap overflow-ellipsis line-clamp-1 text-center font-black text-error">
              s/ {variant.sale_price.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Unidad</p>
            <p>{variant.exchange_rate}</p>
          </div>
          <div className="flex flex-col border-l border-base-content/30 pl-4 p-2">
            <p className="label font-normal">Estado</p>
            <div
              className={clsx({
                "badge font-bold badge-success": variant.active,
                "badge font-bold badge-error": !variant.active,
              })}
            >
              {variant.active ? "Activo" : "Inactivo"}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
