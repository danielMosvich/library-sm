import { useEffect, useState } from "react";
import supabase from "../../../supabase/config";

type CategoryNameProps = {
  categoryId: string | null;
};

export default function CategoryName({ categoryId }: CategoryNameProps) {
  const [categoryName, setCategoryName] = useState("Cargando...");

  useEffect(() => {
    const fetchCategoryName = async () => {
      if (!categoryId) {
        setCategoryName("Sin categoría");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("name")
          .eq("id", categoryId)
          .single();

        if (error) {
          console.error("Error al obtener el nombre de la categoría:", error);
          setCategoryName("Desconocida");
        } else {
          setCategoryName(data.name);
        }
      } catch (error) {
        console.error(
          "Error inesperado al obtener el nombre de la categoría:",
          error
        );
        setCategoryName("Desconocida");
      }
    };

    fetchCategoryName();
  }, [categoryId]);

  return <span>{categoryName}</span>;
}
