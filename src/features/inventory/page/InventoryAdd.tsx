import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../../supabase/config";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";
import { useDebounce } from "../../../hooks/useDebounce";
import Icons from "../../../components/Icons";

interface ProductVariant {
  id: string;
  variant_name: string;
  exchange_rate: number;
  cost_price: number;
  sale_price: number;
  sku: string;
  base_product_id: string;
  image_url?: string;
  barcode?: string;
}

interface BaseProduct {
  id: string;
  name: string;
  brand: string;
  slug: string;
  image_url?: string;
  description?: string;
  variants: ProductVariant[];
}

interface ProductWithVariants {
  id: string;
  name: string;
  brand: string;
  slug: string;
  image_url?: string;
  description?: string;
  product_variants: ProductVariant[];
}

interface Location {
  id: string;
  name: string;
}

interface InventoryFormData {
  product_variant_id: string;
  location_id: string;
  stock: number;
  min_stock: number;
  section: string;
  status: string;
}

export default function InventoryAdd() {
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: <Icons variant="home" /> },
    {
      label: "Inventario",
      href: "/inventory",
      icon: <Icons variant="inventory" />,
    },
    {
      label: "Agregar Inventario",
      href: "/inventory/add",
      icon: <Icons variant="add" />,
    },
  ]);
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [formData, setFormData] = useState<InventoryFormData>({
    product_variant_id: "",
    location_id: "",
    stock: 0,
    min_stock: 0,
    section: "",
    status: "active",
  });

  const [productSearch, setProductSearch] = useState("");
  const debouncedSearch = useDebounce(productSearch, 300);

  // Estado para el modal de confirmación
  const [modalData, setModalData] = useState<{
    show: boolean;
    stock: number;
    inventoryId: string;
  }>({
    show: false,
    stock: 0,
    inventoryId: "",
  });

  // Query para verificar inventario existente
  const { data: existingInventory } = useQuery({
    queryKey: ["existing-inventory", selectedVariant?.id, formData.location_id],
    queryFn: async () => {
      if (!selectedVariant?.id || !formData.location_id) return null;

      const { data, error } = await supabase
        .from("inventory")
        .select("id, stock")
        .eq("product_variant_id", selectedVariant.id)
        .eq("location_id", formData.location_id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data;
    },
    enabled: !!(selectedVariant?.id && formData.location_id),
  });

  // Efecto para mostrar modal cuando se detecta inventario existente
  useEffect(() => {
    if (existingInventory && selectedVariant && formData.location_id) {
      setModalData({
        show: true,
        stock: existingInventory.stock,
        inventoryId: existingInventory.id,
      });

      // Abrir el modal
      const modal = document.getElementById(
        "existing_inventory_modal"
      ) as HTMLDialogElement;
      modal?.showModal();
    }
  }, [existingInventory, selectedVariant, formData.location_id]);

  // Query para productos agrupados con sus variantes
  const { data: productsWithVariants, isLoading: loadingProducts } = useQuery<
    BaseProduct[]
  >({
    queryKey: ["products-with-variants", debouncedSearch],
    queryFn: async () => {
      // Solo ejecutar la query si hay texto de búsqueda
      if (!debouncedSearch.trim()) {
        return [];
      }

      // Normalizar el término de búsqueda: convertir espacios en guiones y viceversa
      const normalizedSearch = debouncedSearch.trim();
      const searchWithDashes = normalizedSearch.replace(/\s+/g, "-");
      const searchWithSpaces = normalizedSearch.replace(/-+/g, " ");

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          brand,
          slug,
          image_url,
          description,
          product_variants!inner (
            id,
            variant_name,
            exchange_rate,
            cost_price,
            sale_price,
            sku,
            base_product_id,
            image_url,
            barcode
          )
        `
        )
        .eq("active", true)
        .eq("product_variants.active", true)
        .or(
          `slug.ilike.%${normalizedSearch}%,slug.ilike.%${searchWithDashes}%,slug.ilike.%${searchWithSpaces}%,name.ilike.%${normalizedSearch}%`
        )
        .order("name");

      if (error) throw error;

      // Transformar los datos para agrupar variantes por producto
      const groupedProducts: BaseProduct[] = [];

      data?.forEach((product: ProductWithVariants) => {
        const existingProduct = groupedProducts.find(
          (p) => p.id === product.id
        );

        if (existingProduct) {
          // Agregar variantes al producto existente
          existingProduct.variants.push(...product.product_variants);
        } else {
          // Crear nuevo producto con sus variantes
          groupedProducts.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            slug: product.slug,
            image_url: product.image_url,
            description: product.description,
            variants: product.product_variants || [],
          });
        }
      });

      return groupedProducts;
    },
    enabled: debouncedSearch.trim().length > 0, // Solo ejecutar si hay texto
  });

  // Query para ubicaciones
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

  // Mutation para crear inventario
  const createInventoryMutation = useMutation({
    mutationFn: async (inventoryData: InventoryFormData) => {
      // Verificación adicional de seguridad antes de insertar
      const { data: existingCheck, error: checkError } = await supabase
        .from("inventory")
        .select("id, stock")
        .eq("product_variant_id", inventoryData.product_variant_id)
        .eq("location_id", inventoryData.location_id)
        .maybeSingle(); // maybeSingle no falla si no encuentra registros

      if (checkError) throw checkError;

      if (existingCheck) {
        throw new Error(
          `Ya existe un registro de inventario para este producto en esta ubicación (Stock actual: ${existingCheck.stock}). ID: ${existingCheck.id}`
        );
      }

      // Si llegamos aquí, no hay duplicados, proceder con la inserción
      const { data, error } = await supabase
        .from("inventory")
        .insert([
          {
            product_variant_id: inventoryData.product_variant_id,
            location_id: inventoryData.location_id,
            stock: inventoryData.stock,
            min_stock: inventoryData.min_stock,
            section: inventoryData.section || null,
            status: inventoryData.status,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey: ["inventory"] });

      // Resetear formulario
      setSelectedVariant(null);
      setFormData({
        product_variant_id: "",
        location_id: "",
        stock: 0,
        min_stock: 0,
        section: "",
        status: "active",
      });

      // Mostrar mensaje de éxito (podrías usar un toast aquí)
      alert("Producto agregado al inventario exitosamente");
    },
    onError: (error) => {
      console.error("Error al agregar producto al inventario:", error);

      // Verificar si es un error de duplicado
      if (error.message.includes("Ya existe un registro de inventario")) {
        alert(
          `❌ ${error.message}\n\n💡 Sugerencia: Use la función de editar para actualizar el stock existente.`
        );
      } else {
        alert("Error al agregar producto al inventario");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedVariant) {
      alert("Debe seleccionar un producto");
      return;
    }

    if (!formData.location_id) {
      alert("Debe seleccionar una ubicación");
      return;
    }

    // Verificación final de seguridad antes del envío
    if (existingInventory) {
      alert(
        "⚠️ Ya existe inventario para este producto en esta ubicación. No se puede crear un duplicado."
      );
      return;
    }

    // Ya no necesitamos verificar existingInventory aquí porque se maneja automáticamente
    createInventoryMutation.mutate({
      ...formData,
      product_variant_id: selectedVariant.id,
    });
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

  const openModal = () => {
    const modal = document.getElementById("product_modal") as HTMLDialogElement;
    modal?.showModal();
  };

  const closeModal = () => {
    const modal = document.getElementById("product_modal") as HTMLDialogElement;
    modal?.close();
  };

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    handleInputChange("product_variant_id", variant.id);
    closeModal();
  };

  // Funciones para manejar el modal de inventario existente
  const handleEditExisting = () => {
    // Cerrar modal y redirigir a edición usando el ID del inventario
    const modal = document.getElementById(
      "existing_inventory_modal"
    ) as HTMLDialogElement;
    modal?.close();
    window.location.href = `/inventory/${modalData.inventoryId}/edit`;
  };

  const handleCancelDuplicate = () => {
    // Cerrar modal y limpiar ubicación
    const modal = document.getElementById(
      "existing_inventory_modal"
    ) as HTMLDialogElement;
    modal?.close();

    setFormData((prev) => ({
      ...prev,
      location_id: "",
    }));

    setModalData({
      show: false,
      stock: 0,
      inventoryId: "",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        Agregar Producto al Inventario
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Producto */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Producto *</span>
          </label>
          <div className="space-y-2">
            <button
              type="button"
              className="btn btn-outline w-full justify-start"
              onClick={openModal}
            >
              {selectedVariant ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded overflow-hidden bg-base-200">
                    <img
                      className="w-full h-full object-cover"
                      src={selectedVariant.image_url || "/images/no-image.webp"}
                      alt={selectedVariant.variant_name}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">
                      {selectedVariant.variant_name}
                    </div>
                    <div className="text-xs opacity-70">
                      SKU: {selectedVariant.sku}
                    </div>
                  </div>
                </div>
              ) : (
                "Seleccionar Producto"
              )}
            </button>

            {selectedVariant && (
              <div className="bg-base-100 p-3 rounded-lg border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Precio Costo:</span> s/{" "}
                    {selectedVariant.cost_price.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Precio Venta:</span> s/{" "}
                    {selectedVariant.sale_price.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Unidad:</span>{" "}
                    {selectedVariant.exchange_rate}
                  </div>
                  <div>
                    <span className="font-medium">SKU:</span>{" "}
                    {selectedVariant.sku}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ubicación */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Ubicación *</span>
          </label>
          <select
            title="Seleccione una ubicación"
            value={formData.location_id}
            onChange={(e) => handleInputChange("location_id", e.target.value)}
            className="select select-bordered w-full"
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
        </div>

        {/* Stock Inicial */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Stock Inicial *</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.stock}
            onChange={(e) =>
              handleInputChange("stock", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full"
            placeholder="Cantidad inicial en inventario"
            required
          />
        </div>

        {/* Stock Mínimo */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Stock Mínimo *</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.min_stock}
            onChange={(e) =>
              handleInputChange("min_stock", parseInt(e.target.value) || 0)
            }
            className="input input-bordered w-full"
            placeholder="Cantidad mínima antes de alerta"
            required
          />
          <label className="label">
            <span className="label-text-alt">
              Cuando el stock llegue a este nivel, se generará una alerta
            </span>
          </label>
        </div>

        {/* Sección */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Sección</span>
          </label>
          <input
            type="text"
            value={formData.section}
            onChange={(e) => handleInputChange("section", e.target.value)}
            className="input input-bordered w-full"
            placeholder="Ej: Pasillo A, Estante 3, etc."
          />
          <label className="label">
            <span className="label-text-alt">
              Ubicación específica dentro del almacén (opcional)
            </span>
          </label>
        </div>

        {/* Estado */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Estado *</span>
          </label>
          <select
            title="Seleccione un estado"
            value={formData.status}
            onChange={(e) => handleInputChange("status", e.target.value)}
            className="select select-bordered w-full"
            required
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="discontinued">Descontinuado</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={createInventoryMutation.isPending}
          >
            {createInventoryMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Guardando...
              </>
            ) : (
              "Agregar al Inventario"
            )}
          </button>
          <button type="button" className="btn btn-outline">
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal para seleccionar producto */}
      <dialog id="product_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-5xl">
          <h3 className="font-bold text-lg mb-4">Seleccionar Producto</h3>

          {/* Buscador */}
          <div className="form-control mb-4">
            <input
              type="text"
              placeholder="Buscar producto (ej: goma en barra sticky o goma-en-barra-sticky)..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="input input-bordered w-full"
            />
            <label className="label">
              <span className="label-text-alt">
                💡 Puedes usar espacios o guiones, ambos funcionan igual
              </span>
            </label>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : !debouncedSearch.trim() ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">🔍</div>
              <div className="font-medium mb-1">Busca un producto</div>
              <div className="text-sm">
                Escribe el nombre del producto para comenzar a buscar
                <br />
                <span className="text-xs opacity-70">
                  (ej: "goma-en-barra-sticky-frutty-40g")
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {productsWithVariants?.map((product) => (
                <div key={product.id} className="bg-base-200 rounded-lg p-4">
                  {/* Encabezado del producto padre */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-base-300">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-base-100">
                      <img
                        className="w-full h-full object-cover"
                        src={product.image_url || "/images/no-image.webp"}
                        alt={product.name}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      <p className="text-sm opacity-70">
                        Marca: {product.brand}
                      </p>
                      <p className="text-xs opacity-50 font-mono">
                        {product.slug}
                      </p>
                      {product.description && (
                        <p className="text-xs opacity-60 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm opacity-70">
                      {
                        product.variants.filter((v) => v.exchange_rate === 1)
                          .length
                      }{" "}
                      variantes disponibles
                    </div>
                  </div>

                  {/* Lista de variantes seleccionables */}
                  <div className="grid gap-2">
                    {product.variants
                      .filter((variant) => variant.exchange_rate === 1)
                      .map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center gap-3 p-3 bg-base-100 rounded-lg hover:bg-base-200 cursor-pointer transition-colors"
                          onClick={() => selectVariant(variant)}
                        >
                          <div className="w-10 h-10 rounded overflow-hidden bg-base-200">
                            <img
                              className="w-full h-full object-cover"
                              src={variant.image_url || "/images/no-image.webp"}
                              alt={variant.variant_name}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {variant.variant_name}
                            </div>
                            <div className="text-xs opacity-70">
                              SKU: {variant.sku}
                            </div>
                            {variant.barcode && (
                              <div className="text-xs opacity-60">
                                Código: {variant.barcode}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-success font-medium">
                              Costo: s/ {variant.cost_price.toFixed(2)}
                            </div>
                            <div className="text-error font-medium">
                              Venta: s/ {variant.sale_price.toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectVariant(variant);
                            }}
                          >
                            Seleccionar
                          </button>
                        </div>
                      ))}

                    {/* Mensaje si no hay variantes válidas */}
                    {product.variants.filter((v) => v.exchange_rate === 1)
                      .length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No hay variantes disponibles para inventario
                        (exchange_rate = 1)
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Mensaje si no hay productos después de buscar */}
              {(!productsWithVariants || productsWithVariants.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">😕</div>
                  <div className="font-medium mb-1">
                    No se encontraron productos
                  </div>
                  <div className="text-sm">
                    No hay productos que coincidan con "{productSearch}"
                    <br />
                    <span className="text-xs opacity-70">
                      Intenta con otro término de búsqueda
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal para inventario existente */}
      <dialog
        id="existing_inventory_modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg text-warning">
            ⚠️ Inventario Existente
          </h3>
          <div className="py-4">
            <p className="mb-4">
              Este producto ya tiene stock en esta ubicación.
            </p>

            {selectedVariant && (
              <div className="bg-base-200 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-base-300">
                    <img
                      className="w-full h-full object-cover"
                      src={selectedVariant.image_url || "/images/no-image.webp"}
                      alt={selectedVariant.variant_name}
                    />
                  </div>
                  <div>
                    <div className="font-medium">
                      {selectedVariant.variant_name}
                    </div>
                    <div className="text-sm opacity-70">
                      SKU: {selectedVariant.sku}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                <strong>Stock actual:</strong> {modalData.stock} unidades
              </span>
            </div>

            <p className="mt-4 text-sm opacity-80">¿Qué desea hacer?</p>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEditExisting}
            >
              📝 Editar Existente
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancelDuplicate}
            >
              🔄 Elegir Otra Ubicación
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
