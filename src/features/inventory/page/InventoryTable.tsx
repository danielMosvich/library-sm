import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { useUiStore } from "../../../app/store/useUiStore";
import {
  fetchConsolidatedInventory,
  type InventoryItem,
} from "../services/inventoryService";
import Icons from "../../../components/Icons";

// Constante para paginación (Asumiendo que useUiStore puede no tenerla definida)
const ITEMS_PER_PAGE = 10;

// Interfaz de la estructura jerárquica para el renderizado
interface GroupedProduct {
  base_product_id: string; // Añadido para facilitar el renderizado del padre
  product_name: string;
  brand: string;
  base_product_image_url: string | null; // Imagen del padre
  category_name: string;
  total_stock_base: number;
  total_stock_sellable: number;
  variants: InventoryItem[];
}
interface GroupedInventory {
  [baseProductId: string]: GroupedProduct;
}

// ====================================================================
// 2. FUNCIÓN DE AGRUPAMIENTO JERÁRQUICO
// ====================================================================

/**
 * Transforma la lista plana de variantes en una estructura jerárquica: Producto Padre -> [Variantes].
 */
const groupInventoryByProduct = (data: InventoryItem[]): GroupedInventory => {
  if (!data || data.length === 0) return {};

  return data.reduce((acc, item) => {
    const key = item.base_product_id;

    const currentStockBase = item.current_stock_base ?? 0;
    const currentStockSellable = item.current_stock_sellable ?? 0;

    if (!acc[key]) {
      acc[key] = {
        base_product_id: item.base_product_id,
        product_name: item.product_name,
        brand: item.brand,
        base_product_image_url: item.base_product_image_url,
        category_name: item.category_name || "N/A",
        total_stock_base: 0,
        total_stock_sellable: 0,
        variants: [],
      };
    }

    acc[key].variants.push(item);
    acc[key].total_stock_base += currentStockBase;
    acc[key].total_stock_sellable += currentStockSellable;

    return acc;
  }, {} as GroupedInventory);
};

// ====================================================================
// 4. COMPONENTE PARA MOSTRAR LAS VARIANTES (FILA EXPANDIDA)
// ====================================================================

function ProductVariantsTable({ variants }: { variants: InventoryItem[] }) {
  return (
    <tr className="">
      <td colSpan={10} className="p-0">
        <div className="bg-base-50 border-b border-base-content/30">
          <table className="table table-sm w-full">
            <thead>
              <tr className="">
                <th className="w-12 border-r"></th>
                <th className="w-16">Imagen</th>
                <th className="text-left">Nombre de variante</th>
                <th>Marca</th>
                <th className="text-center">SKU</th>
                <th className="text-center">Código Barras</th>
                <th>Stock Actual</th>
                <th>Stock Minimo</th>
                <th>Stock Base</th>
                <th>Sección</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variant.variant_id} className="hover">
                  <td className="border-r border-base-content/50 relative">
                    <div className="btn btn-square btn-info btn-xs absolute top-1/3 -right-3 font-black">
                      {index + 1}
                    </div>
                  </td>
                  {/* Imagen de la Variante (variant_image_url) */}
                  <td className="text-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white mx-auto">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          variant.variant_image_url || "/images/no-image.webp"
                        }
                        alt={variant.unit_of_sale_name}
                      />
                    </div>
                  </td>{" "}
                  <td>
                    <div className="text-sm font-medium">
                      {variant.product_name}
                      <span className="text-primary font-bold">
                        {" "}
                        {variant.unit_of_sale_name}{" "}
                      </span>
                      {variant.color_name && (
                        <span className="text-secondary">
                          ({variant.color_name})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="w-full text-base font-semibold text-secondary">
                      {variant.brand}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="kbd w-full">{variant.sku}</div>
                  </td>
                  {/* Código de Barras (barcode) */}
                  <td className="text-center">
                    <div className="kbd w-full text-xs">
                      {variant.barcode || "N/A"}
                    </div>
                  </td>
                  {/* Métrica de Stock Clave: Vendible */}
                  <td className="text-center">
                    <div
                      className={clsx(
                        "font-bold badge truncate",
                        variant.current_stock_sellable <
                          (variant.min_stock ?? 0)
                          ? "badge-error"
                          : "badge-primary"
                      )}
                    >
                      {variant.current_stock_sellable}{" "}
                      <span className="opacity-80 font-normal">
                        {variant.unit_of_sale_name}
                      </span>
                    </div>
                  </td>
                  {/* Stock minimo */}
                  <td className="text-center">
                    <div className="badge font-bold badge-warning truncate">
                      {variant.min_stock ?? 0}
                      {/* <span className="opacity-80 font-normal">
                        {variant.unit_of_sale_name}
                      </span> */}
                    </div>
                  </td>
                  {/* Métrica de Stock Contable */}
                  <td className="text-center">
                    <div className="badge badge-soft font-semibold opacity-70 truncate cursor-pointer select-none">
                      {variant.current_stock_base} und base
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="badge badge-info font-semibold">
                      {variant.section || "N/A"}
                    </div>
                  </td>
                  {/* Estado Activo */}
                  <td className="text-center">
                    <div
                      className={clsx("badge font-black w-full", {
                        "badge-success": variant.active,
                        "badge-error": !variant.active,
                      })}
                    >
                      {variant.active ? "Activo" : "Desactivado"}
                    </div>
                  </td>
                  <td>
                    {/* Simplificando las acciones para el ejemplo */}
                    <div className="flex gap-1 justify-center">
                      <button
                        title="Editar Variante"
                        type="button"
                        className="btn btn-square btn-soft btn-sm btn-warning"
                      >
                        <Icons variant="edit" />
                      </button>
                      <button
                        title="Editar Variante"
                        type="button"
                        className="btn btn-square btn-soft btn-sm btn-error"
                      >
                        <Icons variant="close" width="1.5rem" height="1.5rem" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

// ====================================================================
// 5. COMPONENTE PRINCIPAL (InventoryTable)
// ====================================================================

export default function InventoryTable() {
  // La paginación debe usar 'page' empezando en 1 y 'pageSize' del store
  const [page, setPage] = useState(1);
  const { productsPageSize: pageSize = ITEMS_PER_PAGE } = useUiStore();
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );

  // Adaptar useQuery para manejar { data, total }
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventory", page, pageSize],
    queryFn: () => fetchConsolidatedInventory({ page, pageSize }),
    placeholderData: (previousData) => previousData,
    enabled: page > 0,
  });

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Agrupamiento de datos
  const groupedInventory = useMemo(() => {
    return groupInventoryByProduct(data?.data || []);
  }, [data?.data]);

  const tableData = Object.entries(groupedInventory);

  // --- Lógica de la expansión de filas ---
  const toggleRowExpansion = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const isRowExpanded = (productId: string) => expandedProducts.has(productId);

  // --- Manejo de Estados (Carga/Error/Vacío) ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="text-sm text-gray-600">Cargando inventario...</p>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="w-full min-h-[50vh] flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2 text-error">
            Error al cargar inventario
          </h3>
          <p className="text-gray-600 mb-4">
            {error?.message ||
              "Ocurrió un error al obtener los datos del inventario."}
          </p>
          <button
            type="button"
            className="btn btn-error btn-outline"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ... (Manejo de Error) ...

  if (tableData.length === 0 && !isLoading) {
    // ... (Tu manejo de tabla vacía)
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

  // --- Renderizado de la Tabla Principal (Productos Base) ---
  return (
    <>
      <div className="overflow-x-auto rounded-box border border-base-content/30 bg-base-100">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200 border-base-content/30">
              <th className="w-12"></th>
              <th className="w-14">Imagen</th>
              <th>Producto</th>
              <th>Marca</th>
              <th>Categoria</th>
              <th className="text-center">Stock Total (Base)</th>
              <th className="text-center">Ubicación</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Iteramos sobre los productos base AGRUPADOS */}
            {tableData.map(([baseProductId, productGroup]) => (
              <React.Fragment key={baseProductId}>
                {/* FILA PRINCIPAL: PRODUCTO BASE */}
                <tr
                  className={clsx(
                    "hover font-medium border-base-content/30 cursor-pointer",
                    isRowExpanded(baseProductId) && "bg-info/10"
                  )}
                  onClick={() => toggleRowExpansion(baseProductId)}
                >
                  {/* Botón de Expansión (Columna 1) */}
                  <td className="relative min-w-14">
                    <div
                      className={clsx(
                        "w-full h-full absolute top-0 left-0 flex items-center justify-center",
                        {
                          "btn btn-info rounded-none":
                            isRowExpanded(baseProductId),
                        }
                      )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="2rem"
                        height="2rem"
                        viewBox="0 0 24 24"
                        className={`transition-transform duration-200 ${
                          isRowExpanded(baseProductId) ? "rotate-90" : ""
                        }`}
                      >
                        <path
                          fill="currentColor"
                          d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.42Z"
                        />
                      </svg>
                    </div>
                  </td>

                  {/* Imagen (Usamos la imagen del producto padre o fallback) */}
                  <td>
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          // ✨ Usamos la imagen del producto padre si está disponible, sino la de la primera variante
                          productGroup.base_product_image_url ||
                          productGroup.variants[0]?.variant_image_url ||
                          "/images/no-image.webp"
                        }
                        alt={productGroup.product_name}
                      />
                    </div>
                  </td>

                  {/* Nombre y Marca */}
                  <td>
                    <div className="font-bold first-letter:uppercase">
                      {productGroup.product_name}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium">{productGroup.brand}</div>
                  </td>
                  <td>
                    <div className="font-medium">
                      {productGroup.category_name}
                    </div>
                  </td>
                  {/* Stock Total Consolidado */}
                  <td className="text-center">
                    <div
                      className={clsx("badge badge-lg font-black", {
                        "badge-error": productGroup.total_stock_base === 0,
                        "badge-warning": (() => {
                          // Calculamos el stock promedio mínimo de las variantes
                          const avgMinStock =
                            productGroup.variants.reduce(
                              (acc, variant) => acc + (variant.min_stock ?? 0),
                              0
                            ) / productGroup.variants.length;
                          return (
                            productGroup.total_stock_base > 0 &&
                            productGroup.total_stock_base < avgMinStock
                          );
                        })(),
                        "badge-success":
                          productGroup.total_stock_base >=
                          (() => {
                            const avgMinStock =
                              productGroup.variants.reduce(
                                (acc, variant) =>
                                  acc + (variant.min_stock ?? 0),
                                0
                              ) / productGroup.variants.length;
                            return avgMinStock;
                          })(),
                      })}
                    >
                      {productGroup.total_stock_base} und base
                    </div>
                  </td>

                  {/* Ubicación (Asumimos la ubicación de la primera variante) */}
                  <td className="text-center">
                    {productGroup.variants[0]?.location_name || "N/A"}
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className="flex gap-1 w-full justify-center">
                      <button
                        title="Editar Producto"
                        type="button"
                        className="btn btn-square btn-sm btn-warning"
                      >
                        <Icons variant="edit" />
                      </button>
                      <button
                        title="Eliminar Producto"
                        type="button"
                        className="btn btn-square btn-sm btn-error"
                      >
                        <Icons variant="close" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* FILAS DEL DETALLE: VARIANTES */}
                {isRowExpanded(baseProductId) && (
                  <ProductVariantsTable variants={productGroup.variants} />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Componente de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 p-4 bg-base-200 rounded-box">
          <div className="text-sm text-gray-600">
            Página {page} de {totalPages} ({total} registros total)
          </div>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              «
            </button>
            <button
              className="join-item btn btn-sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              ‹
            </button>
            <button className="join-item btn btn-sm btn-active">{page}</button>
            <button
              className="join-item btn btn-sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              ›
            </button>
            <button
              className="join-item btn btn-sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </>
  );
}
