import { useProductEdit } from "../hooks/useProductEdit";
import { useProductData } from "../hooks/useProductData";
import { useBreadcrumbs } from "../../../hooks/useBreadcrumbs";

export default function ProductEdit() {
  const {
    product,
    isLoading,
    isSubmitting,
    register,
    handleSubmit,
    errors,
    fields,
    onSubmit,
    addVariant,
    removeVariant,
  } = useProductEdit();

  const { categories } = useProductData();

  useBreadcrumbs([
    { label: "Productos", href: "/products" },
    {
      label: product?.name || "Editar Producto",
      href: `/products/${product?.id}/edit`,
    },
  ]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="alert alert-error">
        <span>Producto no encontrado</span>
      </div>
    );
  }

  return (
    <div className="bg-base-100 pb-20 space-y-6">
      {/* Header */}
      <div className="shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Editar Producto</h1>
              <p className="text-sm text-gray-600 mt-1">
                Modifica las propiedades del producto {product.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn btn-ghost"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-edit-form"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4">
        <form
          id="product-edit-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* Información básica */}
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Información Básica</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Nombre del producto *
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${
                      errors.name ? "input-error" : ""
                    }`}
                    {...register("name", {
                      required: "El nombre es requerido",
                      minLength: {
                        value: 2,
                        message: "El nombre debe tener al menos 2 caracteres",
                      },
                    })}
                  />
                  {errors.name && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.name.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Marca *</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${
                      errors.brand ? "input-error" : ""
                    }`}
                    {...register("brand", {
                      required: "La marca es requerida",
                    })}
                  />
                  {errors.brand && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.brand.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Categoría</span>
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Slug</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    {...register("slug", {
                      required: "El slug es requerido",
                    })}
                  />
                  {errors.slug && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.slug.message}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Descripción</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  placeholder="Descripción del producto..."
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      URL de imagen
                    </span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    {...register("image_url")}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Etiquetas (separadas por comas)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="etiqueta1, etiqueta2, etiqueta3"
                    {...register("tags")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Variantes */}
          <div className="card shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-lg">Variantes del Producto</h2>
                <button
                  type="button"
                  onClick={addVariant}
                  className="btn btn-primary btn-sm"
                >
                  + Agregar Variante
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="mb-2">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="font-medium">No hay variantes configuradas</p>
                  <p className="text-sm mt-1">
                    Agrega al menos una variante para el producto
                  </p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="btn btn-primary btn-sm mt-3"
                  >
                    + Crear primera variante
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 ">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">
                          Variante {index + 1}
                          {index === 0 && (
                            <span className="badge badge-primary badge-sm ml-2">
                              Principal
                            </span>
                          )}
                        </h3>
                        {index === 0 ? (
                          <div
                            className="tooltip"
                            data-tip="La variante principal no se puede eliminar"
                          >
                            <button
                              type="button"
                              className="btn btn-error btn-sm btn-outline btn-disabled"
                              disabled
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="btn btn-error btn-sm btn-outline"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">
                              Nombre de variante *
                            </span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.variant_name`, {
                              required: "El nombre de variante es requerido",
                            })}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">SKU *</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.sku`, {
                              required: "El SKU es requerido",
                            })}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">
                              Código de barras
                            </span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.barcode`)}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">
                              Precio de costo *
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.cost_price`, {
                              required: "El precio de costo es requerido",
                              min: {
                                value: 0,
                                message: "El precio debe ser mayor a 0",
                              },
                            })}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">
                              Precio de venta *
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.sale_price`, {
                              required: "El precio de venta es requerido",
                              min: {
                                value: 0,
                                message: "El precio debe ser mayor a 0",
                              },
                            })}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">Moneda</span>
                          </label>
                          <select
                            className="select select-bordered select-sm"
                            {...register(`variants.${index}.currency`)}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="MXN">MXN</option>
                          </select>
                        </div>

                        <div className="form-control md:col-span-2">
                          <label className="label">
                            <span className="label-text text-sm">
                              URL de imagen
                            </span>
                          </label>
                          <input
                            type="url"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.image_url`)}
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm">
                              Tasa de cambio
                            </span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input input-bordered input-sm"
                            {...register(`variants.${index}.exchange_rate`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
