import { useForm } from "react-hook-form";
import supabase from "../../supabase/config";
import type { TablesInsert } from "../../../database.types";
import { toast } from "sonner";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";

type CategoryInsert = TablesInsert<"categories">;

type CategoryHierarchy = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  full_path: string;
};

export default function CategoryAdd() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parent");

  // Configurar breadcrumbs para la página de agregar categoría
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: "🏠" },
    { label: "Categorías", href: "/categories", icon: "📦" },
    { label: "Agregar Categoría", icon: "➕" },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInsert>();

  const [allCategories, setAllCategories] = useState<CategoryHierarchy[]>([]);
  const [selectedParent, setSelectedParent] =
    useState<CategoryHierarchy | null>(null);
  const [hasParent, setHasParent] = useState(!!parentId); // Auto-activar si hay parentId

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        console.log("Iniciando consulta de todas las categorías...");

        const { data, error, status } = await supabase
          .from("categories")
          .select("id, name, parent_id")
          .eq("active", true)
          .order("name");

        console.log("Respuesta de consulta:", { data, error, status });

        if (error) {
          console.error(
            "Error al obtener categorías:",
            error,
            "Estado:",
            status,
            "Código:",
            error.code,
            "Detalles:",
            error.details
          );
          toast.error("Error al cargar categorías: " + error.message);
        } else {
          console.log("Categorías obtenidas exitosamente:", data);

          // Procesar las categorías para crear la jerarquía visual
          const processedCategories = buildCategoryHierarchy(data || []);
          setAllCategories(processedCategories);
        }
      } catch (err) {
        console.error("Error inesperado al obtener categorías:", err);
        toast.error("Error inesperado al cargar categorías");
      }
    };

    fetchAllCategories();
  }, []);

  // useEffect para preseleccionar la categoría padre desde la URL
  useEffect(() => {
    if (parentId && allCategories.length > 0) {
      const parentCategory = allCategories.find((cat) => cat.id === parentId);
      if (parentCategory) {
        setSelectedParent(parentCategory);
        setHasParent(true);
        console.log("Categoría padre preseleccionada:", parentCategory);
      } else {
        console.warn("No se encontró la categoría padre con ID:", parentId);
      }
    }
  }, [parentId, allCategories]);

  // Función para construir la jerarquía visual
  const buildCategoryHierarchy = (
    categories: { id: string; name: string; parent_id: string | null }[]
  ): CategoryHierarchy[] => {
    const categoryMap = new Map<string, CategoryHierarchy>();

    // Crear mapa de categorías
    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        ...cat,
        level: 0,
        full_path: cat.name,
      });
    });

    // Calcular niveles y rutas completas
    const calculateHierarchy = (
      categoryId: string,
      visited = new Set<string>()
    ): CategoryHierarchy => {
      if (visited.has(categoryId)) {
        // Evitar recursión infinita
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

    // Procesar todas las categorías
    categories.forEach((cat) => {
      calculateHierarchy(cat.id);
    });

    // Convertir a array y ordenar por jerarquía
    const result = Array.from(categoryMap.values());

    // Ordenar: primero por nivel, luego por nombre
    result.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  };

  const onSubmit = async (data: CategoryInsert) => {
    if (hasParent) {
      if (!selectedParent) {
        toast.error("Debes seleccionar una categoría padre.");
        return;
      }

      if (selectedParent.name.toLowerCase() === data.name.toLowerCase()) {
        toast.error(
          "El nombre de la categoría no puede ser el mismo que el de su padre."
        );
        return;
      }
    }

    const { data: existingCategory, error: nameError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", data.name)
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

    const insertData = {
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      active: data.active ?? true,
      parent_id: hasParent && selectedParent ? selectedParent.id : null,
    };

    console.log("Datos a insertar:", insertData);

    const { error, data: insertedData } = await supabase
      .from("categories")
      .insert(insertData)
      .select();

    if (error) {
      console.error("Error al crear la categoría:", error);
      toast.error("Error al crear la categoría: " + error.message);
      return;
    }

    console.log("Categoría creada exitosamente:", insertedData);

    const categoryType = hasParent ? "subcategoría" : "categoría raíz";
    toast.success(
      `¡${
        categoryType.charAt(0).toUpperCase() + categoryType.slice(1)
      } creada exitosamente!`
    );

    // Redirigir a /categories después de un breve delay
    setTimeout(() => {
      navigate("/categories");
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">
            <span className="text-primary">📁</span>
            Nueva Categoría
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

            {/* Toggle para padre */}
            {/* Indicador de preselección desde URL */}
            {parentId && selectedParent && (
              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current w-6 h-6 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Se preseleccionó automáticamente "{selectedParent.name}" como
                  categoría padre
                </span>
              </div>
            )}

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
                      ? parentId
                        ? "Esta categoría será una subcategoría de la categoría seleccionada"
                        : "Esta categoría tendrá una categoría padre"
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
                    {parentId
                      ? "Puedes cambiar la categoría padre si lo deseas"
                      : "Selecciona cualquier categoría para usar como padre"}
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
                      {allCategories.length === 0 ? (
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
                      Nivel: {selectedParent.level} → Nueva categoría será nivel{" "}
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
                  defaultChecked={true}
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
                disabled={isSubmitting}
                className="btn btn-primary flex-1"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Crear Categoría
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
