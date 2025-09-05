import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import supabase from "../../../supabase/config";
import type { Tables } from "../../../../database.types";
import { Link } from "react-router";
import { useUiStore } from "../../../app/store/useUiStore";

interface InventoryItem extends Tables<"inventory"> {
  product_variant: Tables<"product_variants"> & {
    base_product?: {
      name: string;
      brand: string;
    };
  };
  location?: {
    name: string;
  };
}

async function fetchInventory({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}): Promise<{ data: InventoryItem[]; total: number }> {
  const { data, error, count } = await supabase
    .from("inventory")
    .select(
      "*, product_variant:product_variants(*, base_product:products(name, brand)), location:locations(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
  };
}

export default function InventoryTable() {
  const [page, setPage] = useState(1);
  // const pageSize = 10;
  const { productsPageSize: pageSize } = useUiStore();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventory", page, pageSize],
    queryFn: () => fetchInventory({ page, pageSize }),
    placeholderData: (previousData) => previousData,
    enabled: page > 0,
  });

  const tableData = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="text-sm text-gray-600">Cargando inventario...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="alert alert-error">
        <div>
          <h3 className="font-bold">Error al cargar inventario</h3>
          <div className="text-xs">
            {error?.message ||
              "Ocurrió un error inesperado. Intenta nuevamente."}
          </div>
        </div>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="w-full min-h-[50vh] flex justify-center items-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No hay inventario</h3>
          <p className="text-gray-600">
            No se encontraron registros de inventario.
          </p>
          <Link to="/inventory/add">
            <button type="button" className="btn btn-sm mt-4 btn-info">
              Agregar inventario
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-box border border-base-content/30 bg-base-100">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200 border-base-content/30">
              <th>Imagen</th>
              <th>Producto</th>
              <th>Marca</th>
              <th className="text-center">Variante</th>
              <th className="text-center">Código</th>
              <th className="text-center">SKU</th>
              <th className="text-center">Stock Actual</th>
              <th className="text-center">Stock Minimo</th>
              <th className="text-center">Ubicacion</th>
              <th className="text-center">Sección</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item) => (
              <tr
                key={item.id}
                className="hover font-medium border-base-content/30"
              >
                <td>
                  <img
                    src={
                      item.product_variant.image_url || "/images/no-image.webp"
                    }
                    alt={item.product_variant.variant_name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </td>
                <td>{item.product_variant.base_product?.name || "N/A"}</td>
                <td>{item.product_variant.base_product?.brand || "N/A"}</td>
                <td className="text-center">
                  {item.product_variant.variant_name || "N/A"}
                </td>
                <td className="text-center">
                  <div className="kbd">
                    {item.product_variant.barcode || "N/A"}
                  </div>
                </td>
                <td className="text-center">
                  <div className="kbd">{item.product_variant.sku || "N/A"}</div>
                </td>
                <td className="text-center font-black text-success truncate">
                  <div className="kbd">{item.stock} Unidades</div>
                </td>
                <td className="text-center font-black text-warning truncate">
                  <div className="kbd">{item.min_stock} Unidades</div>
                </td>
                <td className="text-center">{item.location?.name || "N/A"}</td>
                <td className="text-center">{item.section || "N/A"}</td>
                <td className="text-center">
                  <div
                    className={clsx("badge font-black badge-sm", {
                      "badge-success": item.status === "active",
                      "badge-error": item.status !== "active",
                    })}
                  >
                    {item.status || "N/A"}
                  </div>
                </td>

                <td>
                  <div className="flex gap-2 justify-center">
                    <Link
                      to={`/inventory/${item.id}/edit`}
                      type="button"
                      className="btn btn-sm btn-soft btn-warning"
                      title="Editar inventario"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1rem"
                        height="1rem"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z"
                        />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-soft btn-error"
                      title="Eliminar inventario"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1rem"
                        height="1rem"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Paginación */}
      <div className="flex flex-row justify-end items-center gap-4 fixed bottom-5 right-5 bg-base-200 border border-base-content/30 z-30 h-fit rounded-field pl-2">
        <div className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </div>
        <div className="join">
          <button
            type="button"
            className="btn join-item"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Ir a la página anterior"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.3rem"
              height="1.3rem"
              viewBox="0 0 48 48"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                d="M31 36L19 24l12-12"
              />
            </svg>
          </button>
          <button type="button" className="btn join-item">
            {page}
          </button>
          <button
            type="button"
            className="btn join-item"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Ir a la página siguiente"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.3rem"
              height="1.3rem"
              viewBox="0 0 48 48"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                d="m19 12l12 12l-12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
