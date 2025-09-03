import { useParams, Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../supabase/config";
import type { Tables } from "../../../database.types";
import { toast } from "sonner";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";

type Category = Tables<"categories">;

type CategoryWithChildren = Category & {
  children_count: number;
};

export default function CategoryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({
      categoryId,
      deleteSubcategories,
    }: {
      categoryId: string;
      deleteSubcategories: boolean;
    }) => {
      // Primero verificamos si tiene subcategorías
      const { data: subcategories, error: subError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("parent_id", categoryId);

      if (subError) throw subError;

      if (subcategories && subcategories.length > 0) {
        if (deleteSubcategories) {
          // Eliminar todas las subcategorías primero (en cascada)
          const { error: subDeleteError } = await supabase
            .from("categories")
            .delete()
            .eq("parent_id", categoryId);

          if (subDeleteError) throw subDeleteError;
        } else {
          // Convertir subcategorías en categorías raíz
          const { error: updateError } = await supabase
            .from("categories")
            .update({ parent_id: null })
            .eq("parent_id", categoryId);

          if (updateError) throw updateError;
        }
      }

      // Finalmente eliminar la categoría
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      return { subcategoriesCount: subcategories?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      if (data.subcategoriesCount > 0) {
        toast.success(
          `Subcategoría eliminada exitosamente. ${data.subcategoriesCount} subcategoría(s) afectada(s).`
        );
      } else {
        toast.success("Subcategoría eliminada exitosamente");
      }
    },
    onError: (error: Error) => {
      console.error("Error al eliminar subcategoría:", error);
      toast.error("Error al eliminar subcategoría: " + error.message);
    },
  });

  // Función para manejar edición
  const handleEdit = (categoryId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/categories/${categoryId}/edit`);
  };

  // Función para manejar eliminación
  const handleDelete = async (
    categoryId: string,
    categoryName: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Primero verificamos si tiene subcategorías
    const { data: subcategories, error: subError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("parent_id", categoryId);

    if (subError) {
      toast.error("Error al verificar subcategorías: " + subError.message);
      return;
    }

    const hasSubcategories = subcategories && subcategories.length > 0;

    if (hasSubcategories) {
      // Mostrar diálogo con opciones para subcategorías
      const subcategoryNames = subcategories!
        .map((sub: { name: string }) => sub.name)
        .join(", ");

      const userChoice = window.confirm(
        `La subcategoría "${categoryName}" tiene ${
          subcategories!.length
        } subcategoría(s): ${subcategoryNames}\n\n` +
          `¿Qué deseas hacer?\n\n` +
          `• Presiona "Aceptar" para ELIMINAR TAMBIÉN las subcategorías\n` +
          `• Presiona "Cancelar" para CONVERTIR las subcategorías en categorías principales\n` +
          `• Cierra este diálogo para cancelar la operación`
      );

      if (userChoice === null) return; // Usuario canceló

      const deleteSubcategories = userChoice; // true = eliminar, false = convertir a raíz

      // Confirmación final
      const finalConfirm = window.confirm(
        deleteSubcategories
          ? `⚠️ ADVERTENCIA: Esto eliminará permanentemente la subcategoría "${categoryName}" y TODAS sus ${
              subcategories!.length
            } subcategoría(s). Esta acción no se puede deshacer.\n\n¿Estás seguro?`
          : `Esto eliminará la subcategoría "${categoryName}" y convertirá sus ${
              subcategories!.length
            } subcategoría(s) en categorías principales.\n\n¿Continuar?`
      );

      if (finalConfirm) {
        deleteMutation.mutate({ categoryId, deleteSubcategories });
      }
    } else {
      // No tiene subcategorías, confirmación simple
      const confirmDelete = window.confirm(
        `¿Estás seguro de que deseas eliminar la subcategoría "${categoryName}"?\n\nEsta acción no se puede deshacer.`
      );

      if (confirmDelete) {
        deleteMutation.mutate({ categoryId, deleteSubcategories: false });
      }
    }
  };

  // Consulta para obtener la categoría actual
  const { data: currentCategory, isLoading: categoryLoading } =
    useQuery<Category>({
      queryKey: ["category", id],
      queryFn: async () => {
        if (!id) throw new Error("ID de categoría requerido");

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

  // Función para construir el breadcrumb
  const buildBreadcrumb = async (categoryId: string): Promise<Category[]> => {
    const breadcrumb: Category[] = [];
    let currentId = categoryId;

    while (currentId) {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", currentId)
        .single();

      if (error || !data) break;

      breadcrumb.unshift(data);
      currentId = data.parent_id;
    }

    return breadcrumb;
  };

  // Consulta para el breadcrumb
  const { data: breadcrumb = [] } = useQuery<Category[]>({
    queryKey: ["breadcrumb", id],
    queryFn: () => buildBreadcrumb(id!),
    enabled: !!id,
  });

  // Configurar breadcrumbs globales basados en la jerarquía de categorías
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: "🏠" },
    { label: "Categorías", href: "/categories", icon: "📦" },
    ...breadcrumb.map((cat, index) => ({
      label: cat.name,
      href: index < breadcrumb.length - 1 ? `/categories/${cat.id}` : undefined,
      icon: "📁",
    })),
  ]);

  // Consulta para obtener las subcategorías
  const {
    data: subcategories,
    isLoading: subcategoriesLoading,
    error: subcategoriesError,
  } = useQuery<CategoryWithChildren[]>({
    queryKey: ["subcategories", id],
    queryFn: async () => {
      if (!id) throw new Error("ID de categoría requerido");

      const { data: subcategoriesData, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", id)
        .order("name");

      if (error) throw error;

      // Obtener el conteo de hijos para cada subcategoría
      const subcategoriesWithChildren = await Promise.all(
        (subcategoriesData || []).map(async (subcategory: Category) => {
          const { count, error: countError } = await supabase
            .from("categories")
            .select("*", { count: "exact", head: true })
            .eq("parent_id", subcategory.id);

          if (countError) throw countError;

          return {
            ...subcategory,
            children_count: count || 0,
          };
        })
      );

      return subcategoriesWithChildren;
    },
    enabled: !!id,
  });

  if (categoryLoading) {
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
    <div className="container mx-auto p-6">
      {/* Header de la categoría */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{currentCategory.name}</h1>
          {currentCategory.description && (
            <p className="text-base-content/70 text-lg">
              {currentCategory.description}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <span
              className={`badge ${
                currentCategory.active ? "badge-success" : "badge-error"
              }`}
            >
              {currentCategory.active ? "Activa" : "Inactiva"}
            </span>
            <span className="badge badge-outline">
              {new Date(currentCategory.created_at!).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Link
          to="/categories/add"
          state={{
            parentId: currentCategory.id,
            parentName: currentCategory.name,
          }}
          className="btn btn-primary"
        >
          <span className="text-lg">+</span>
          Agregar Subcategoría
        </Link>
      </div>

      {subcategoriesLoading ? (
        <div className="flex justify-center items-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : subcategoriesError ? (
        <div className="alert alert-error max-w-2xl mx-auto m-6">
          <span>
            Error al cargar subcategorías: {subcategoriesError.message}
          </span>
        </div>
      ) : !subcategories || subcategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold mb-2">No hay subcategorías</h3>
          <p className="text-base-content/60 mb-4">
            Esta categoría no tiene subcategorías aún
          </p>
          <Link
            to="/categories/add"
            state={{
              parentId: currentCategory.id,
              parentName: currentCategory.name,
            }}
            className="btn btn-primary"
          >
            Crear primera subcategoría
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subcategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              to={`/categories/${subcategory.id}`}
              className="group"
            >
              <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-base-300">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="card-title text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                        {subcategory.name}
                      </h2>
                      {subcategory.description && (
                        <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                          {subcategory.description}
                        </p>
                      )}
                    </div>

                    {/* Menú de opciones */}
                    <Menu as="div" className="relative">
                      <MenuButton
                        className="btn btn-ghost btn-sm btn-circle hover:bg-base-200"
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </MenuButton>
                      <MenuItems className="absolute right-0 mt-2 w-48 bg-base-100 border border-base-300 rounded-md shadow-lg z-10">
                        <MenuItem>
                          <button
                            onClick={(e) => handleEdit(subcategory.id, e)}
                            className="flex items-center w-full px-4 py-2 text-sm hover:bg-base-200 transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Editar subcategoría
                          </button>
                        </MenuItem>
                        <MenuItem>
                          <button
                            onClick={(e) =>
                              handleDelete(subcategory.id, subcategory.name, e)
                            }
                            className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Eliminar subcategoría
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                      <span className="badge badge-primary badge-sm">
                        {subcategory.children_count} subcategorías
                      </span>
                      <span
                        className={`badge badge-sm ${
                          subcategory.active ? "badge-success" : "badge-error"
                        }`}
                      >
                        {subcategory.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <div className="text-xs text-base-content/50">
                      {new Date(subcategory.created_at!).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
