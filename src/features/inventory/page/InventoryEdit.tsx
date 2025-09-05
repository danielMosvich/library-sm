import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../../supabase/config";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";
import Icons from "../../../components/Icons";

// ============================
// INTERFACES & TYPES
// ============================

interface InventoryData {
  id: string;
  product_variant_id: string;
  location_id: string;
  stock: number;
  min_stock: number;
  section: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  product_variants: {
    id: string;
    variant_name: string;
    sku: string;
    cost_price: number;
    sale_price: number;
    exchange_rate: number;
    image_url?: string;
    base_product_id: string;
    products: {
      name: string;
      brand: string;
    };
  };
  locations: {
    name: string;
  };
}

interface Location {
  id: string;
  name: string;
}

interface InventoryFormData {
  location_id: string;
  stock: number;
  min_stock: number;
  section: string;
  status: string;
}

// ============================
// COMPONENT
// ============================

export default function InventoryEdit() {
  // ============================
  // HOOKS & STATE
  // ============================

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Configurar breadcrumbs para navegación
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: <Icons variant="home" /> },
    {
      label: "Inventario",
      href: "/inventory",
      icon: <Icons variant="inventory" />,
    },
    {
      label: "Editar Inventario",
      href: `/inventory/${id}/edit`,
      icon: <Icons variant="settings" />,
    },
  ]);

  // Estado del formulario
  const [formData, setFormData] = useState<InventoryFormData>({
    location_id: "",
    stock: 0,
    min_stock: 0,
    section: "",
    status: "active",
  });

  // ============================
  // DATA QUERIES
  // ============================

  // Obtener datos del inventario con relaciones a product_variants y products
  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory", id],
    queryFn: async () => {
      if (!id) throw new Error("ID de inventario requerido");

      const { data, error } = await supabase
        .from("inventory")
        .select(
          `
          id,
          product_variant_id,
          location_id,
          stock,
          min_stock,
          section,
          status,
          created_at,
          updated_at,
          product_variants!inventory_product_variant_id_fkey (
            id,
            variant_name,
            sku,
            cost_price,
            sale_price,
            exchange_rate,
            image_url,
            base_product_id,
            products:base_product_id (
              name,
              brand
            )
          ),
          locations (
            name
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error en la consulta:", error);
        throw error;
      }

      return data as unknown as InventoryData;
    },
    enabled: !!id,
  });

  // Obtener todas las ubicaciones disponibles para el selector
  const { data: locations, isLoading: loadingLocations } = useQuery<Location[]>(
    {
      queryKey: ["locations"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("locations")
          .select("id, name")
          .order("name");

        if (error) throw error;
        return data || [];
      },
    }
  );

  // ============================
  // EFFECTS
  // ============================

  // Cargar datos del inventario en el formulario cuando estén disponibles
  useEffect(() => {
    if (inventoryData) {
      setFormData({
        location_id: inventoryData.location_id,
        stock: inventoryData.stock,
        min_stock: inventoryData.min_stock,
        section: inventoryData.section || "",
        status: inventoryData.status,
      });
    }
  }, [inventoryData]);

  // ============================
  // MUTATIONS
  // ============================

  // Mutation para actualizar el inventario
  const updateInventoryMutation = useMutation({
    mutationFn: async (updateData: InventoryFormData) => {
      if (!id) throw new Error("ID de inventario requerido");

      const { data, error } = await supabase
        .from("inventory")
        .update({
          location_id: updateData.location_id,
          stock: updateData.stock,
          min_stock: updateData.min_stock,
          section: updateData.section || null,
          status: updateData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", id] });

      // Mostrar mensaje de éxito y redirigir
      alert("✅ Inventario actualizado exitosamente");
      navigate("/inventory");
    },
    onError: (error) => {
      console.error("Error al actualizar inventario:", error);
      alert("❌ Error al actualizar inventario. Intente nuevamente.");
    },
  });

  // ============================
  // EVENT HANDLERS
  // ============================

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación básica
    if (!formData.location_id) {
      alert("⚠️ Debe seleccionar una ubicación");
      return;
    }

    if (formData.stock < 0) {
      alert("⚠️ El stock no puede ser negativo");
      return;
    }

    if (formData.min_stock < 0) {
      alert("⚠️ El stock mínimo no puede ser negativo");
      return;
    }

    updateInventoryMutation.mutate(formData);
  };

  const handleInputChange = (
    field: keyof InventoryFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancel = () => {
    navigate("/inventory");
  };

  // ============================
  // RENDER STATES
  // ============================

  // Estado de carga
  if (loadingInventory) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">
            Cargando información del inventario...
          </p>
        </div>
      </div>
    );
  }

  // Estado de error - inventario no encontrado
  if (!inventoryData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-4 text-base-content">
            Inventario no encontrado
          </h2>
          <p className="text-base-content/70 mb-6">
            El registro de inventario que buscas no existe o fue eliminado.
          </p>
          <button
            onClick={() => navigate("/inventory")}
            className="btn btn-primary gap-2"
          >
            <Icons variant="inventory" />
            Volver al Inventario
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // MAIN RENDER
  // ============================

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-base-content mb-2">
          Editar Inventario
        </h1>
        <p className="text-base-content/70">
          Modifica la información del inventario del producto
        </p>
      </div>

      {/* Información del producto - Card mejorada */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base-content mb-4 flex items-center gap-2">
            <Icons variant="inventory" />
            Información del Producto
          </h2>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Imagen del producto */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-base-200 shadow-md">
                <img
                  className="w-full h-full object-cover"
                  src={
                    inventoryData.product_variants?.image_url ||
                    "/images/no-image.webp"
                  }
                  alt={inventoryData.product_variants?.variant_name}
                />
              </div>
            </div>

            {/* Información principal */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-base-content">
                  {inventoryData.product_variants?.products?.name}
                </h3>
                <p className="text-sm text-base-content/70 font-medium">
                  Variante: {inventoryData.product_variants?.variant_name}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="badge badge-outline gap-1">
                  <span className="font-medium">SKU:</span>
                  {inventoryData.product_variants?.sku}
                </div>
                <div className="badge badge-secondary badge-outline gap-1">
                  <span className="font-medium">Marca:</span>
                  {inventoryData.product_variants?.products?.brand}
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="flex-shrink-0">
              <div className="stats shadow bg-base-200">
                <div className="stat py-3 px-4">
                  <div className="stat-title text-xs">Precio Costo</div>
                  <div className="stat-value text-warning text-lg">
                    S/ {inventoryData.product_variants?.cost_price?.toFixed(2)}
                  </div>
                </div>
                <div className="stat py-3 px-4">
                  <div className="stat-title text-xs">Precio Venta</div>
                  <div className="stat-value text-success text-lg">
                    S/ {inventoryData.product_variants?.sale_price?.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de edición */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base-content mb-6 flex items-center gap-2">
            <Icons variant="settings" />
            Editar Información del Inventario
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ubicación */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content flex items-center gap-2">
                    📍 Ubicación *
                  </span>
                </label>
                <select
                  title="Seleccione una ubicación"
                  value={formData.location_id}
                  onChange={(e) =>
                    handleInputChange("location_id", e.target.value)
                  }
                  className="select select-bordered w-full focus:select-primary"
                  required
                >
                  <option value="">Seleccione una ubicación</option>
                  {loadingLocations ? (
                    <option disabled>Cargando ubicaciones...</option>
                  ) : (
                    locations?.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))
                  )}
                </select>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    📍 Ubicación actual:{" "}
                    <strong>{inventoryData.locations?.name}</strong>
                  </span>
                </label>
              </div>

              {/* Estado */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content flex items-center gap-2">
                    🔄 Estado *
                  </span>
                </label>
                <select
                  title="Seleccione un estado"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="select select-bordered w-full focus:select-primary"
                  required
                >
                  <option value="active">✅ Activo</option>
                  <option value="inactive">⏸️ Inactivo</option>
                  <option value="discontinued">❌ Descontinuado</option>
                  <option value="pending">⏳ Pendiente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stock Actual */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content flex items-center gap-2">
                    📦 Stock Actual *
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={(e) =>
                    handleInputChange("stock", parseInt(e.target.value) || 0)
                  }
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="Cantidad actual en inventario"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Unidades disponibles para venta
                  </span>
                </label>
              </div>

              {/* Stock Mínimo */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content flex items-center gap-2">
                    ⚠️ Stock Mínimo *
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.min_stock}
                  onChange={(e) =>
                    handleInputChange(
                      "min_stock",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="input input-bordered w-full focus:input-primary"
                  placeholder="Cantidad mínima antes de alerta"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Se generará alerta cuando llegue a este nivel
                  </span>
                </label>
              </div>
            </div>

            {/* Sección */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content flex items-center gap-2">
                  🗂️ Sección (Opcional)
                </span>
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => handleInputChange("section", e.target.value)}
                className="input input-bordered w-full focus:input-primary"
                placeholder="Ej: Pasillo A, Estante 3, Zona Norte, etc."
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Ubicación específica dentro del almacén
                </span>
              </label>
            </div>

            {/* Información adicional del registro */}
            <div className="alert alert-info">
              <Icons variant="settings" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">
                  📋 Información del Registro
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-base-content/80">
                      Creado:
                    </span>
                    <span className="text-base-content">
                      {new Date(inventoryData.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-base-content/80">
                      Última actualización:
                    </span>
                    <span className="text-base-content">
                      {new Date(inventoryData.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-base-content/80">
                      ID del registro:
                    </span>
                    <span className="text-base-content font-mono text-xs">
                      {inventoryData.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="submit"
                className="btn btn-primary flex-1 gap-2"
                disabled={updateInventoryMutation.isPending}
              >
                {updateInventoryMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Actualizando inventario...
                  </>
                ) : (
                  <>
                    <Icons variant="settings" />
                    Actualizar Inventario
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline gap-2"
                onClick={handleCancel}
                disabled={updateInventoryMutation.isPending}
              >
                <Icons variant="home" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
