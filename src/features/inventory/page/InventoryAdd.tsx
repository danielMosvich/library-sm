import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../../supabase/config";

interface Product {
  id: string;
  variant_name: string;
  exchange_rate: number;
  cost_price: number;
  sale_price: number;
  sku: string;
  base_product_id: string;
  image_url?: string;
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
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    product_variant_id: "",
    location_id: "",
    stock: 0,
    min_stock: 0,
    section: "",
    status: "active",
  });

  const [productSearch, setProductSearch] = useState("");

  // Query para productos
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["product-variants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          `
          id, 
          variant_name, 
          exchange_rate, 
          cost_price, 
          sale_price, 
          sku, 
          base_product_id,
          image_url
        `
        )
        .eq("active", true)
        .order("variant_name");

      if (error) throw error;
      return data || [];
    },
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
      setSelectedProduct(null);
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
      alert("Error al agregar producto al inventario");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert("Debe seleccionar un producto");
      return;
    }

    if (!formData.location_id) {
      alert("Debe seleccionar una ubicación");
      return;
    }
    // console.log(formData);
    createInventoryMutation.mutate({
      ...formData,
      product_variant_id: selectedProduct.id,
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

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    handleInputChange("product_variant_id", product.id);
    closeModal();
  };

  // Filtrar productos por búsqueda
  const filteredProducts =
    products?.filter(
      (product) =>
        product.variant_name
          .toLowerCase()
          .includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase())
    ) || [];

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
              {selectedProduct ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded overflow-hidden bg-base-200">
                    <img
                      className="w-full h-full object-cover"
                      src={selectedProduct.image_url || "/images/no-image.webp"}
                      alt={selectedProduct.variant_name}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">
                      {selectedProduct.variant_name}
                    </div>
                    <div className="text-xs opacity-70">
                      SKU: {selectedProduct.sku}
                    </div>
                  </div>
                </div>
              ) : (
                "Seleccionar Producto"
              )}
            </button>

            {selectedProduct && (
              <div className="bg-base-100 p-3 rounded-lg border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Precio Costo:</span> s/{" "}
                    {selectedProduct.cost_price.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Precio Venta:</span> s/{" "}
                    {selectedProduct.sale_price.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Unidad:</span>{" "}
                    {selectedProduct.exchange_rate}
                  </div>
                  <div>
                    <span className="font-medium">SKU:</span>{" "}
                    {selectedProduct.sku}
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
        <div className="modal-box max-w-4xl">
          <h3 className="font-bold text-lg mb-4">Seleccionar Producto</h3>

          {/* Buscador */}
          <div className="form-control mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Precio Costo</th>
                    <th>Precio Venta</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover">
                      <td>
                        <div className="w-10 h-10 rounded overflow-hidden bg-base-200">
                          <img
                            className="w-full h-full object-cover"
                            src={product.image_url || "/images/no-image.webp"}
                            alt={product.variant_name}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">
                          {product.variant_name}
                        </div>
                      </td>
                      <td>
                        <code className="text-xs bg-base-200 px-2 py-1 rounded">
                          {product.sku}
                        </code>
                      </td>
                      <td className="text-success font-medium">
                        s/ {product.cost_price.toFixed(2)}
                      </td>
                      <td className="text-error font-medium">
                        s/ {product.sale_price.toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => selectProduct(product)}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && !loadingProducts && (
                <div className="text-center py-8 text-gray-500">
                  {productSearch
                    ? "No se encontraron productos con ese criterio"
                    : "No hay productos disponibles"}
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
    </div>
  );
}
