import { useForm } from "react-hook-form";
import supabase from "../../supabase/config";
import type { TablesUpdate, Tables } from "../../../database.types";
import { toast } from "sonner";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";

type CategoryUpdate = TablesUpdate<"categories">;
type Category = Tables<"categories">;

type CategoryHierarchy = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  full_path: string;
};

export default function CategoryEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryUpdate>();

  const [allCategories, setAllCategories] = useState<CategoryHierarchy[]>([]);
  const [selectedParent, setSelectedParent] =
    useState<CategoryHierarchy | null>(null);
  const [hasParent, setHasParent] = useState(false);

  // Consulta para obtener la categoría actual
  const { data: currentCategory, isLoading } = useQuery<Category>({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) throw new Error("ID de categoría no proporcionado");

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Configurar breadcrumbs para la página de edición
  useBreadcrumbs(
    currentCategory
      ? [
          { label: "Inicio", href: "/", icon: "🏠" },
          { label: "Categorías", href: "/categories", icon: "📦" },
          { label: `Editar: ${currentCategory.name}`, icon: "✏️" },
        ]
      : [
          { label: "Inicio", href: "/", icon: "🏠" },
          { label: "Categorías", href: "/categories", icon: "📦" },
        ]
  );

  // Mutation para actualizar categoría
  const updateMutation = useMutation({
    mutationFn: async (data: CategoryUpdate) => {
      if (!id) throw new Error("ID de categoría no proporcionado");

      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Categoría actualizada exitosamente");
      navigate("/categories");
    },
    onError: (error: Error) => {
      console.error("Error al actualizar categoría:", error);
      toast.error("Error al actualizar categoría: " + error.message);
    },
  });

  // Consulta para obtener todas las categorías para el selector de padre
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "all", id],
    queryFn: async () => {
      // Primero obtenemos todas las categorías
      const { data: allCats, error: allError } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .eq("active", true)
        .order("name");

      if (allError) throw allError;

      // Filtrar excluyendo la categoría actual y sus descendientes
      const excludedIds = new Set<string>();
      if (id) {
        excludedIds.add(id);

        // Función recursiva para encontrar todos los descendientes
        const findDescendants = (parentId: string) => {
          allCats?.forEach((cat) => {
            if (cat.parent_id === parentId && !excludedIds.has(cat.id)) {
              excludedIds.add(cat.id);
              findDescendants(cat.id);
            }
          });
        };

        findDescendants(id);
      }

      return allCats?.filter((cat) => !excludedIds.has(cat.id)) || [];
    },
    enabled: !!id,
  });

  // Procesar categorías cuando se cargan
  useEffect(() => {
    if (categoriesData) {
      console.log("Categorías cargadas:", categoriesData);
      const processedCategories = buildCategoryHierarchy(categoriesData);
      console.log("Categorías procesadas:", processedCategories);
      setAllCategories(processedCategories);
    }
  }, [categoriesData]);

  // Prellenar el formulario cuando se carga la categoría
  useEffect(() => {
    if (currentCategory) {
      reset({
        name: currentCategory.name,
        description: currentCategory.description,
        image_url: currentCategory.image_url,
        active: currentCategory.active,
      });

      setHasParent(!!currentCategory.parent_id);

      // Si tiene padre, buscarlo en la lista
      if (currentCategory.parent_id && allCategories.length > 0) {
        const parentCategory = allCategories.find(
          (cat) => cat.id === currentCategory.parent_id
        );
        setSelectedParent(parentCategory || null);
      }
    }
  }, [currentCategory, allCategories, reset]);

  // Función para construir la jerarquía visual
  const buildCategoryHierarchy = (
    categories: { id: string; name: string; parent_id: string | null }[]
  ): CategoryHierarchy[] => {
    const categoryMap = new Map<string, CategoryHierarchy>();

    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        level: 0,
        full_path: cat.name,
      });
    });

    const calculateHierarchy = (
      categoryId: string,
      visited = new Set<string>()
    ): CategoryHierarchy => {
      if (visited.has(categoryId)) {
        return categoryMap.get(categoryId)!;
      }

      visited.add(categoryId);
      const category = categoryMap.get(categoryId)!;

      if (category.parent_id) {
        const parent = calculateHierarchy(category.parent_id, visited);
        category.level = parent.level + 1;
        category.full_path = `${parent.full_path} → ${category.name}`;
      }

      return category;
    };

    categories.forEach((cat) => {
      calculateHierarchy(cat.id);
    });

    const result = Array.from(categoryMap.values());
    result.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  };

  const onSubmit = async (data: CategoryUpdate) => {
    if (hasParent) {
      if (!selectedParent) {
        toast.error("Debes seleccionar una categoría padre.");
        return;
      }

      if (selectedParent.name.toLowerCase() === data.name?.toLowerCase()) {
        toast.error(
          "El nombre de la categoría no puede ser el mismo que el de su padre."
        );
        return;
      }
    }

    // Verificar nombres duplicados (excluyendo la categoría actual)
    const { data: existingCategory, error: nameError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", data.name!)
      .neq("id", id!)
      .single();

    if (nameError && nameError.code !== "PGRST116") {
      toast.error("Error al verificar el nombre: " + nameError.message);
      return;
    }

    if (existingCategory) {
      toast.error(
        "El nombre de la categoría ya existe. Por favor, elige otro."
      );
      return;
    }

    const updateData = {
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      active: data.active ?? true,
      parent_id: hasParent && selectedParent ? selectedParent.id : null,
    };

    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto m-6">
        <span>Categoría no encontrada</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">
            <span className="text-primary">✏️</span>
            Editar Categoría: {currentCategory.name}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Nombre *</span>
              </label>
              <input
                type="text"
                placeholder="Ingresa el nombre de la categoría"
                {...register("name", { required: "El nombre es obligatorio" })}
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : ""
                }`}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.name.message}
                  </span>
                </label>
              )}
            </div>

            {/* Descripción */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Descripción</span>
              </label>
              <textarea
                placeholder="Describe la categoría (opcional)"
                {...register("description")}
                className="textarea textarea-bordered w-full h-24 resize-none"
              />
            </div>

            {/* URL de la Imagen */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  URL de la Imagen
                </span>
              </label>
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                {...register("image_url")}
                className="input input-bordered w-full"
              />
            </div>

            <div className="divider">Configuración de Jerarquía</div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={hasParent}
                  onChange={(e) => {
                    setHasParent(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedParent(null);
                    }
                  }}
                  className="toggle toggle-primary"
                />
                <div>
                  <span className="label-text font-semibold">
                    ¿Es una subcategoría?
                  </span>
                  <p className="text-sm text-base-content/70">
                    {hasParent
                      ? "Esta categoría tendrá una categoría padre"
                      : "Esta será una categoría raíz"}
                  </p>
                </div>
              </label>
            </div>

            {/* Selector de categoría padre */}
            {hasParent && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Categoría Padre *
                  </span>
                  <span className="label-text-alt">
                    Selecciona cualquier categoría para usar como padre
                  </span>
                </label>
                <Listbox value={selectedParent} onChange={setSelectedParent}>
                  <div className="relative">
                    <ListboxButton className="input input-bordered w-full text-left flex items-center justify-between">
                      <span
                        className={
                          selectedParent
                            ? "text-base-content"
                            : "text-base-content/50"
                        }
                      >
                        {selectedParent
                          ? selectedParent.full_path
                          : "Selecciona una categoría padre"}
                      </span>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </ListboxButton>
                    <ListboxOptions className="absolute z-10 mt-1 w-full bg-base-100 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {!categoriesData ? (
                        <div className="p-4 text-center text-gray-500">
                          <span className="loading loading-spinner loading-sm mr-2"></span>
                          Cargando categorías...
                        </div>
                      ) : allCategories.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No hay categorías disponibles
                        </div>
                      ) : (
                        allCategories.map((category) => (
                          <ListboxOption
                            key={category.id}
                            value={category}
                            className="p-3 hover:bg-primary/10 cursor-pointer transition-colors"
                            style={{
                              paddingLeft: `${category.level * 20 + 12}px`,
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {"  ".repeat(category.level)}
                                {category.level > 0 ? "└ " : ""}
                                {category.name}
                              </span>
                              <div className="flex gap-1">
                                {category.level === 0 && (
                                  <span className="badge badge-primary badge-xs">
                                    Raíz
                                  </span>
                                )}
                                {category.level > 0 && (
                                  <span className="badge badge-secondary badge-xs">
                                    Nivel {category.level}
                                  </span>
                                )}
                              </div>
                            </div>
                            {category.level > 0 && (
                              <div className="text-xs text-base-content/60 mt-1">
                                {category.full_path}
                              </div>
                            )}
                          </ListboxOption>
                        ))
                      )}
                    </ListboxOptions>
                  </div>
                </Listbox>

                {selectedParent && (
                  <div className="mt-2 p-3 bg-base-200 rounded-lg">
                    <div className="text-sm text-base-content/70">
                      Categoría padre seleccionada:
                    </div>
                    <div className="font-medium">
                      {selectedParent.full_path}
                    </div>
                    <div className="text-xs text-base-content/60">
                      Nivel: {selectedParent.level} → Esta categoría será nivel{" "}
                      {selectedParent.level + 1}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Estado activo */}
            <div className="divider">Estado</div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  {...register("active")}
                  className="toggle toggle-success"
                />
                <div>
                  <span className="label-text font-semibold">
                    Categoría Activa
                  </span>
                  <p className="text-sm text-base-content/70">
                    Las categorías activas aparecerán en el sistema
                  </p>
                </div>
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/categories")}
                className="btn btn-outline flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {isSubmitting || updateMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Actualizar Categoría
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
