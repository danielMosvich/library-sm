import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import supabase from "../../../../supabase/config";
import { toast } from "sonner";
import type { Tables } from "../../../../../database.types";

// Tipos para el formulario
interface ProductFormData {
  name: string;
  brand: string;
  category_id?: string;
  description?: string;
  image_url?: string;
  tags: string;
  slug: string;
  variants: VariantFormData[];
}

interface VariantFormData {
  id?: string; // Para variantes existentes
  variant_name: string;
  barcode?: string;
  sale_price: number;
  cost_price: number;
  image_url?: string;
  exchange_rate: number;
  sku: string;
  currency: string;
  hasInventory: boolean;
  inventoryStock: string;
  inventoryMinStock: string;
  inventoryLocationId: string;
  inventorySection: string;
  inventoryId?: string; // Para inventario existente
}

interface ProductEditFormProps {
  product: Tables<"products"> & {
    category?: { id: string; name: string };
    variants?: Array<
      Tables<"product_variants"> & {
        inventory?: Array<
          Tables<"inventory"> & {
            locations?: Tables<"locations">;
          }
        >;
      }
    >;
  };
}

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Preparar datos iniciales del formulario
  const defaultValues: ProductFormData = {
    name: product.name || "",
    brand: product.brand || "",
    category_id: product.category_id || "",
    description: product.description || "",
    image_url: product.image_url || "",
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    slug: product.slug || "",
    variants:
      product.variants?.map((variant) => ({
        id: variant.id,
        variant_name: variant.variant_name || "",
        barcode: variant.barcode || "",
        sale_price: variant.sale_price || 0,
        cost_price: variant.cost_price || 0,
        image_url: variant.image_url || "",
        exchange_rate: variant.exchange_rate || 1,
        sku: variant.sku || "",
        currency: variant.currency || "PEN",
        hasInventory:
          variant.inventory && variant.inventory.length > 0 ? true : false,
        inventoryStock: variant.inventory?.[0]?.stock?.toString() || "",
        inventoryMinStock: variant.inventory?.[0]?.min_stock?.toString() || "",
        inventoryLocationId: variant.inventory?.[0]?.location_id || "",
        inventorySection: variant.inventory?.[0]?.section || "",
        inventoryId: variant.inventory?.[0]?.id || "",
      })) || [],
  };

  const form = useForm<ProductFormData>({
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "variants",
  });

  // Estados para el modal de variantes
  const [newVariant, setNewVariant] = useState<Partial<VariantFormData>>({
    variant_name: "",
    barcode: "",
    sale_price: 0,
    cost_price: 0,
    image_url: "",
    exchange_rate: 1,
    sku: "",
    currency: "PEN",
    hasInventory: false,
    inventoryStock: "",
    inventoryMinStock: "",
    inventoryLocationId: "",
    inventorySection: "",
  });

  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries para obtener datos necesarios
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Generar SKU único
  const generateSKU = useCallback(() => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SKU-${timestamp}-${random}`.toUpperCase();
  }, []);

  // Generar slug a partir del nombre
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, []);

  // Watch para generar slug automático
  const watchName = watch("name");
  useEffect(() => {
    if (watchName) {
      const newSlug = generateSlug(watchName);
      setValue("slug", newSlug);
    }
  }, [watchName, generateSlug, setValue]);

  // Funciones para el modal de variantes
  const openEditVariantModal = useCallback(
    (index: number) => {
      const variant = fields[index];
      console.log("Abriendo modal para editar variante:", variant);

      // Crear una copia completa del objeto para evitar problemas de referencia
      setNewVariant({
        id: variant.id,
        variant_name: variant.variant_name,
        barcode: variant.barcode || "",
        sale_price: variant.sale_price,
        cost_price: variant.cost_price,
        image_url: variant.image_url || "",
        exchange_rate: variant.exchange_rate,
        sku: variant.sku,
        currency: variant.currency,
        hasInventory: variant.hasInventory,
        inventoryStock: variant.inventoryStock || "",
        inventoryMinStock: variant.inventoryMinStock || "",
        inventoryLocationId: variant.inventoryLocationId || "",
        inventorySection: variant.inventorySection || "",
        inventoryId: variant.inventoryId || "",
      });

      setEditingVariantIndex(index);
      const modal = document.getElementById(
        "edit_variant_modal"
      ) as HTMLDialogElement;
      modal?.showModal();
    },
    [fields]
  );

  const openAddVariantModal = useCallback(() => {
    setNewVariant({
      variant_name: "",
      barcode: "",
      sale_price: 0,
      cost_price: 0,
      image_url: "",
      exchange_rate: 1,
      sku: generateSKU(),
      currency: "PEN",
      hasInventory: false,
      inventoryStock: "",
      inventoryMinStock: "",
      inventoryLocationId: "",
      inventorySection: "",
    });
    setEditingVariantIndex(null);
    const modal = document.getElementById(
      "edit_variant_modal"
    ) as HTMLDialogElement;
    modal?.showModal();
  }, [generateSKU]);

  const saveVariant = useCallback(() => {
    console.log("Guardando variante:", newVariant);
    console.log("Índice de edición:", editingVariantIndex);

    if (!newVariant.variant_name || !newVariant.sku) {
      toast.error("Nombre y SKU son requeridos");
      return;
    }

    if (editingVariantIndex !== null) {
      // Editar variante existente - SIMPLIFICADO
      const existingVariant = fields[editingVariantIndex];
      console.log("Variante existente:", existingVariant);

      const updatedVariant = {
        ...existingVariant, // Mantener todos los datos existentes
        ...newVariant, // Sobrescribir con los nuevos datos
        id: existingVariant.id, // Asegurar que mantenga el ID original
      } as VariantFormData;

      console.log("Variante actualizada:", updatedVariant);

      // Solo usar update - eliminar la llamada a setValue que causa conflictos
      update(editingVariantIndex, updatedVariant);
      console.log("Variante actualizada en el formulario");
    } else {
      // Agregar nueva variante
      const newVar = {
        ...newVariant,
        id: `temp-${Date.now()}`,
      } as VariantFormData;
      console.log("Agregando nueva variante:", newVar);
      append(newVar);
    }

    const modal = document.getElementById(
      "edit_variant_modal"
    ) as HTMLDialogElement;
    modal?.close();
    toast.success(
      editingVariantIndex !== null
        ? "Variante actualizada"
        : "Variante agregada"
    );
  }, [newVariant, editingVariantIndex, fields, append, update]);

  const removeVariant = useCallback(
    (index: number) => {
      if (fields.length <= 1) {
        toast.error("Debe haber al menos una variante");
        return;
      }
      remove(index);
      toast.success("Variante eliminada");
    },
    [fields.length, remove]
  );

  // Función para enviar el formulario - MEJORADA
  const onSubmit = async (data: ProductFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      console.log("Datos del formulario:", data);

      const tagsArray = data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Actualizar producto
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: data.name,
          brand: data.brand,
          category_id: data.category_id || null,
          description: data.description || null,
          image_url: data.image_url || null,
          tags: tagsArray,
          slug: data.slug,
        })
        .eq("id", product.id);

      if (productError) throw productError;
      console.log("Producto actualizado exitosamente");

      console.log("=== INICIANDO ACTUALIZACIÓN DE VARIANTES ===");

      // Array para almacenar las variantes actualizadas
      const variantesActualizadas: VariantFormData[] = [];

      for (let i = 0; i < data.variants.length; i++) {
        const variant = data.variants[i];
        console.log(`\n--- PROCESANDO VARIANTE ${i + 1} ---`);

        const isExistingVariant = variant.id && !variant.id.startsWith("temp-");

        if (isExistingVariant) {
          // Actualizar variante existente
          const updateData = {
            variant_name: variant.variant_name,
            barcode: variant.barcode || null,
            sale_price: Number(variant.sale_price),
            cost_price: Number(variant.cost_price),
            image_url: variant.image_url || null,
            exchange_rate: Number(variant.exchange_rate),
            sku: variant.sku,
            currency: variant.currency,
          };

          console.log("Actualizando variante existente:", variant.id);

          const { data: updateResponse, error: variantError } = await supabase
            .from("product_variants")
            .update(updateData)
            .eq("id", variant.id)
            .select()
            .single();

          if (variantError) {
            console.error("Error al actualizar variante:", variantError);
            throw variantError;
          }

          console.log("Variante actualizada exitosamente:", updateResponse);

          // Agregar al array la variante actualizada
          variantesActualizadas.push({
            ...variant,
            ...updateResponse,
            sale_price: updateResponse.sale_price,
            cost_price: updateResponse.cost_price,
            exchange_rate: updateResponse.exchange_rate,
          });

          // Manejar inventario
          if (variant.hasInventory) {
            if (variant.inventoryId) {
              await supabase
                .from("inventory")
                .update({
                  stock: parseInt(variant.inventoryStock) || 0,
                  min_stock: parseInt(variant.inventoryMinStock) || 0,
                  location_id: variant.inventoryLocationId || null,
                  section: variant.inventorySection || null,
                })
                .eq("id", variant.inventoryId);
            } else {
              await supabase.from("inventory").insert({
                product_variant_id: variant.id,
                stock: parseInt(variant.inventoryStock) || 0,
                min_stock: parseInt(variant.inventoryMinStock) || 0,
                location_id: variant.inventoryLocationId || null,
                section: variant.inventorySection || null,
              });
            }
          } else if (variant.inventoryId) {
            await supabase
              .from("inventory")
              .delete()
              .eq("id", variant.inventoryId);
          }
        } else {
          // Crear nueva variante - CORRECCIÓN DEL ERROR
          const insertData = {
            base_product_id: product.id,
            variant_name: variant.variant_name,
            barcode: variant.barcode || null,
            sale_price: Number(variant.sale_price),
            cost_price: Number(variant.cost_price),
            image_url: variant.image_url || null,
            exchange_rate: Number(variant.exchange_rate),
            sku: variant.sku,
            currency: variant.currency,
          };

          console.log("Creando nueva variante:", insertData);

          const { data: newVariantData, error: variantError } = await supabase
            .from("product_variants")
            .insert(insertData)
            .select()
            .single();

          if (variantError) {
            console.error("Error al crear nueva variante:", variantError);
            throw variantError;
          }

          console.log("Nueva variante creada:", newVariantData);

          // Agregar al array la nueva variante
          variantesActualizadas.push({
            ...variant,
            id: newVariantData.id,
            ...newVariantData,
          });

          // Crear inventario si es necesario
          if (variant.hasInventory && newVariantData) {
            await supabase.from("inventory").insert({
              product_variant_id: newVariantData.id,
              stock: parseInt(variant.inventoryStock) || 0,
              min_stock: parseInt(variant.inventoryMinStock) || 0,
              location_id: variant.inventoryLocationId || null,
              section: variant.inventorySection || null,
            });
          }
        }
      }

      console.log("=== ACTUALIZANDO FORMULARIO CON DATOS FRESCOS ===");

      // Actualizar el formulario UNA SOLA VEZ al final
      setValue("variants", variantesActualizadas);
      console.log("Formulario actualizado con:", variantesActualizadas);

      toast.success("Producto actualizado exitosamente");

      // Invalidar cache de React Query
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({
        queryKey: ["product", product.id],
      });

      console.log("=== PROCESO COMPLETADO ===");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      toast.error("Error al actualizar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container ">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 sm:space-y-8"
      >
        {/* Información básica del producto */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title text-lg sm:text-xl mb-4">
              Información del Producto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {/* Nombre del producto */}
              <div className="form-control sm:col-span-2 lg:col-span-2 xl:col-span-3">
                <label className="label">
                  <span className="label-text font-semibold">
                    Nombre del producto *
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("name", { required: "El nombre es requerido" })}
                  placeholder="Ingrese el nombre del producto"
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.name.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Marca */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Marca</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("brand")}
                  placeholder="Marca del producto"
                />
              </div>

              {/* Categoría */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Categoría</span>
                </label>
                <select
                  className="select select-bordered"
                  {...register("category_id")}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slug */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Slug *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("slug", { required: "El slug es requerido" })}
                  placeholder="slug-del-producto"
                />
                {errors.slug && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.slug.message}
                    </span>
                  </label>
                )}
              </div>

              {/* Descripción */}
              <div className="form-control sm:col-span-2 lg:col-span-2 xl:col-span-3">
                <label className="label">
                  <span className="label-text font-semibold">Descripción</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={3}
                  {...register("description")}
                  placeholder="Descripción del producto"
                />
              </div>

              {/* URL de imagen */}
              <div className="form-control sm:col-span-2 lg:col-span-2 xl:col-span-3">
                <label className="label">
                  <span className="label-text font-semibold">
                    URL de imagen
                  </span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  {...register("image_url")}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              {/* Tags */}
              <div className="form-control sm:col-span-2 lg:col-span-2 xl:col-span-3">
                <label className="label">
                  <span className="label-text font-semibold">
                    Etiquetas (separadas por comas)
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  {...register("tags")}
                  placeholder="etiqueta1, etiqueta2, etiqueta3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de variantes */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
              <h2 className="card-title text-lg sm:text-xl">
                Variantes del Producto
              </h2>
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto"
                onClick={openAddVariantModal}
              >
                Agregar Variante
              </button>
            </div>

            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-base-content/70">
                  No hay variantes agregadas
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="card bg-base-200 hover:bg-base-300 transition-colors duration-200"
                  >
                    <div className="card-body p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                          {/* Imagen de la variante */}
                          <div className="flex justify-center sm:justify-start">
                            <div className="avatar">
                              <div className="w-16 h-16 rounded-lg">
                                <img
                                  src={
                                    field.image_url || "/images/no-image.webp"
                                  }
                                  alt={field.variant_name}
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Información de la variante */}
                          <div className="sm:col-span-2">
                            <h3 className="font-semibold text-lg text-center sm:text-left">
                              {field.variant_name}
                            </h3>
                            <p className="text-sm text-base-content/70 text-center sm:text-left">
                              SKU: {field.sku}
                            </p>
                            {field.barcode && (
                              <p className="text-sm text-base-content/70 text-center sm:text-left">
                                Código: {field.barcode}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                              <span className="badge badge-outline badge-sm">
                                {field.currency}
                              </span>
                              <span className="badge badge-outline badge-sm">
                                Cambio: {field.exchange_rate}
                              </span>
                              {field.hasInventory && (
                                <span className="badge badge-success badge-sm">
                                  Con inventario
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Precios */}
                          <div className="text-center sm:text-right">
                            <p className="font-semibold text-lg">
                              S/ {field.sale_price?.toFixed(2)}
                            </p>
                            <p className="text-sm text-base-content/70">
                              Costo: S/ {field.cost_price?.toFixed(2)}
                            </p>
                            {field.hasInventory && (
                              <p className="text-sm text-info">
                                Stock: {field.inventoryStock}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="dropdown dropdown-end self-center sm:self-start">
                          <div
                            tabIndex={0}
                            role="button"
                            className="btn btn-ghost btn-sm"
                          >
                            ⋮
                          </div>
                          <ul
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                          >
                            <li>
                              <button
                                type="button"
                                onClick={() => openEditVariantModal(index)}
                              >
                                Editar
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="text-error"
                              >
                                Eliminar
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            className="btn btn-ghost w-full sm:w-auto"
            onClick={() => navigate("/products")}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`btn btn-primary w-full sm:w-auto ${
              isSubmitting ? "loading" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Actualizando..." : "Actualizar Producto"}
          </button>
        </div>
      </form>

      {/* Modal para editar variantes */}
      <dialog id="edit_variant_modal" className="modal">
        <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
          <h3 className="font-bold text-lg mb-4">
            {editingVariantIndex !== null
              ? "Editar Variante"
              : "Agregar Variante"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre de la variante */}
            <div className="form-control sm:col-span-2 lg:col-span-1">
              <label className="label">
                <span className="label-text font-semibold">
                  Nombre de la variante *
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={newVariant.variant_name || ""}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    variant_name: e.target.value,
                  }))
                }
                placeholder="Nombre de la variante"
              />
            </div>

            {/* SKU */}
            <div className="form-control sm:col-span-2 lg:col-span-1">
              <label className="label">
                <span className="label-text font-semibold">SKU *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={newVariant.sku || ""}
                onChange={(e) =>
                  setNewVariant((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="SKU único"
              />
            </div>

            {/* Precio de venta */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Precio de venta *
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={newVariant.sale_price || ""}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    sale_price: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            {/* Precio de costo */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Precio de costo *
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={newVariant.cost_price || ""}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    cost_price: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            {/* Tipo de cambio */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Tipo de cambio</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered"
                value={newVariant.exchange_rate || 1}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    exchange_rate: parseFloat(e.target.value) || 1,
                  }))
                }
                placeholder="1.00"
              />
            </div>

            {/* Moneda */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Moneda</span>
              </label>
              <select
                className="select select-bordered"
                value={newVariant.currency || "PEN"}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    currency: e.target.value,
                  }))
                }
              >
                <option value="PEN">PEN (Soles)</option>
                <option value="USD">USD (Dólares)</option>
                <option value="EUR">EUR (Euros)</option>
              </select>
            </div>

            {/* Código de barras */}
            <div className="form-control sm:col-span-2">
              <label className="label">
                <span className="label-text font-semibold">
                  Código de barras
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={newVariant.barcode || ""}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    barcode: e.target.value,
                  }))
                }
                placeholder="Código de barras (opcional)"
              />
            </div>

            {/* URL de imagen */}
            <div className="form-control sm:col-span-2">
              <label className="label">
                <span className="label-text font-semibold">URL de imagen</span>
              </label>
              <input
                type="url"
                className="input input-bordered"
                value={newVariant.image_url || ""}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            {/* Inventario */}
            <div className="form-control sm:col-span-2">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">
                  ¿Manejar inventario?
                </span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={newVariant.hasInventory || false}
                  onChange={(e) =>
                    setNewVariant((prev) => ({
                      ...prev,
                      hasInventory: e.target.checked,
                    }))
                  }
                />
              </label>
            </div>

            {/* Campos de inventario (solo si hasInventory es true) */}
            {newVariant.hasInventory && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Stock inicial
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={newVariant.inventoryStock || ""}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        inventoryStock: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Stock mínimo
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={newVariant.inventoryMinStock || ""}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        inventoryMinStock: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Ubicación</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={newVariant.inventoryLocationId || ""}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        inventoryLocationId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar ubicación</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Sección</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={newVariant.inventorySection || ""}
                    onChange={(e) =>
                      setNewVariant((prev) => ({
                        ...prev,
                        inventorySection: e.target.value,
                      }))
                    }
                    placeholder="Sección (opcional)"
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-action flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="btn btn-ghost w-full sm:w-auto order-2 sm:order-1"
              onClick={() => {
                const modal = document.getElementById(
                  "edit_variant_modal"
                ) as HTMLDialogElement;
                modal?.close();
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
              onClick={saveVariant}
            >
              {editingVariantIndex !== null ? "Actualizar" : "Agregar"} Variante
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
