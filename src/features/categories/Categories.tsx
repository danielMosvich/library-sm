import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../supabase/config";
import type { Tables } from "../../../database.types";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import Icons from "../../components/Icons";

type Category = Tables<"categories">;

type CategoryWithChildren = Category & {
  children_count: number;
};

export default function Categories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Configurar breadcrumbs para la página de categorías principales
  useBreadcrumbs([
    { label: "Inicio", href: "/", icon: <Icons variant="home" /> },
    {
      label: "Categorías",
      href: "/categories",
      icon: <Icons variant="category" />,
    },
  ]);

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

      // Finalmente eliminar la categoría padre
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      return { subcategoriesCount: subcategories?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });

      if (data.subcategoriesCount > 0) {
        toast.success(
          `Categoría eliminada exitosamente. ${data.subcategoriesCount} subcategoría(s) afectada(s).`
        );
      } else {
        toast.success("Categoría eliminada exitosamente");
      }
    },
    onError: (error: Error) => {
      console.error("Error al eliminar categoría:", error);
      toast.error("Error al eliminar categoría: " + error.message);
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
        `La categoría "${categoryName}" tiene ${
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
          ? `⚠️ ADVERTENCIA: Esto eliminará permanentemente la categoría "${categoryName}" y TODAS sus ${
              subcategories!.length
            } subcategoría(s). Esta acción no se puede deshacer.\n\n¿Estás seguro?`
          : `Esto eliminará la categoría "${categoryName}" y convertirá sus ${
              subcategories!.length
            } subcategoría(s) en categorías principales.\n\n¿Continuar?`
      );

      if (finalConfirm) {
        deleteMutation.mutate({ categoryId, deleteSubcategories });
      }
    } else {
      // No tiene subcategorías, confirmación simple
      const confirmDelete = window.confirm(
        `¿Estás seguro de que deseas eliminar la categoría "${categoryName}"?\n\nEsta acción no se puede deshacer.`
      );

      if (confirmDelete) {
        deleteMutation.mutate({ categoryId, deleteSubcategories: false });
      }
    }
  };

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery<CategoryWithChildren[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      // Primero obtenemos las categorías padre
      const { data: parentCategories, error: parentError } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null)
        .order("name");

      if (parentError) throw parentError;

      // Luego obtenemos el conteo de hijos para cada categoría padre
      const categoriesWithChildren = await Promise.all(
        (parentCategories || []).map(async (category: Category) => {
          const { count, error: countError } = await supabase
            .from("categories")
            .select("*", { count: "exact", head: true })
            .eq("parent_id", category.id);

          if (countError) throw countError;

          return {
            ...category,
            children_count: count || 0,
          };
        })
      );

      return categoriesWithChildren;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto m-6">
        <span>Error al cargar categorías: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black">Inventario</h2>
        <h3 className="text-xl label">Gestion el inventario</h3>
      </div>
      <div className="flex justify-between items-center mb-6">
        {/* <h1 className="text-3xl font-bold">Categorías</h1> */}
        <Link to="/categories/add" className="btn btn-primary">
          <span className="text-lg">+</span>
          Agregar Categoría
        </Link>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">No hay categorías</h3>
          <p className="text-base-content/60 mb-4">
            Comienza creando tu primera categoría
          </p>
          <Link to="/categories/add" className="btn btn-primary">
            Crear primera categoría
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}`}
              className="group"
            >
              <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-base-300 h-full">
                <figure className="md:max-h-52 md:min-h-52 max-h-32 min-h-32">
                  <img
                    src={category.image_url || "/images/no-image.webp"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </figure>
                <div className="card-body p-2 md:p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="card-title text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-sm text-base-content/70 line-clamp-2">
                          {category.description}
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
                            onClick={(e) => handleEdit(category.id, e)}
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
                            Editar categoría
                          </button>
                        </MenuItem>
                        <MenuItem>
                          <button
                            onClick={(e) =>
                              handleDelete(category.id, category.name, e)
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
                            Eliminar categoría
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex gap-2 flex-wrap">
                      {category.children_count > 0 && (
                        <span className="badge badge-primary badge-sm truncate">
                          {category.children_count} subcategorías
                        </span>
                      )}
                      <span
                        className={`badge badge-sm ${
                          category.active ? "badge-success" : "badge-error"
                        }`}
                      >
                        {category.active ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/50">
                    {new Date(category.created_at!).toLocaleDateString()}
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
