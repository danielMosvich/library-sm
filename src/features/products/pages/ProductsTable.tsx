import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import supabase from "../../../supabase/config";
import type { Tables } from "../../../../database.types";
import { useUiStore } from "../../../app/store/useUiStore";
import { Link } from "react-router";
import CategoryName from "../components/CategoryName"; // Asegúrate de que la ruta sea correcta

interface ProductVariant {
  id: number;
  name: string;
  price: number;
}

// Tipo extendido para incluir variantes
interface ProductWithVariants extends Tables<"products"> {
  variants: ProductVariant[];
}

async function fetchProductsWithVariants({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}): Promise<{ data: ProductWithVariants[]; total: number }> {
  const { data, error, count } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)", { count: "exact" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
  };
}

export default function ProductsTable() {
  const productsPageSize = useUiStore((s) => s.productsPageSize);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", page, productsPageSize],
    queryFn: () =>
      fetchProductsWithVariants({ page, pageSize: productsPageSize }),
    placeholderData: (previousData) => previousData,
    enabled: page > 0 && productsPageSize > 0,
  });

  const tableData = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / productsPageSize);

  const toggleRow = (productId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div>Cargando productos...</div>;
  }

  if (isError) {
    return <div>Error al cargar productos: {error?.message}</div>;
  }

  if (tableData.length === 0) {
    return (
      <div>
        <p>No hay productos disponibles.</p>
        <Link to="/products/add">
          <button>Agregar producto</button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((product) => (
            <>
              <tr
                key={Number(product.id)}
                onClick={() => toggleRow(Number(product.id))}
              >
                <td>{product.name}</td>
                <td>{product.brand}</td>
                <td>
                  <CategoryName categoryId={product.category_id} />
                </td>
                <td>
                  <button>Editar</button>
                  <button>Eliminar</button>
                </td>
              </tr>
              {expandedRows.has(Number(product.id)) && (
                <tr>
                  <td colSpan={4}>
                    <table>
                      <thead>
                        <tr>
                          <th>Variante</th>
                          <th>Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((variant) => (
                          <tr key={variant.id}>
                            <td>{variant.name}</td>
                            <td>{variant.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Anterior
        </button>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
