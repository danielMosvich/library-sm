import supabase from "../supabase/config";

interface Subcategory {
  id: string;
  name: string;
}

interface CategoryAPIResponse {
  success: boolean;
  data?: {
    name: string;
    id: string;
  };
  error?: {
    message: string;
    code: string;
    detalle?: string;
  };
}

export async function generateCategoryWithAI(
  product: string,
  brand: string
): Promise<string> {
  const productName = `${product} ${brand}`.trim();

  const subcategories = await getSubcategoriesFromSupabase();

  console.log("🔍 Debugging categorización IA:");
  console.log("- Producto:", productName);
  console.log("- Total subcategorías:", subcategories.length);
  console.log("- URL API:", import.meta.env.VITE_AI_API_URL);
  console.log("- Subcategorías:", subcategories);

  const requestBody = {
    product: productName,
    subcategories: subcategories,
  };

  console.log("📤 Enviando request body:", requestBody);

  const response = await fetch(
    `${import.meta.env.VITE_AI_API_URL}/api/ai/question`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    console.error("❌ Error en respuesta:");
    console.error("- Status:", response.status);
    console.error("- Status Text:", response.statusText);

    // Intentar leer el cuerpo de la respuesta de error
    try {
      const errorBody = await response.text();
      console.error("- Error Body:", errorBody);

      // Intentar parsear como JSON si es posible
      try {
        const errorJson = JSON.parse(errorBody);
        console.error("- Error JSON:", errorJson);
      } catch {
        console.error("- No es JSON válido");
      }
    } catch {
      console.error("- No se pudo leer el cuerpo del error");
    }

    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result: CategoryAPIResponse = await response.json();
  console.log("✅ Respuesta exitosa:", result);

  if (!result.success) {
    throw new Error(result.error?.message || "Error desconocido");
  }

  if (!result.data?.id) {
    throw new Error("La API no devolvió un ID válido");
  }

  const validSubcategory = subcategories.find(
    (sub) => sub.id === result.data!.id
  );
  if (!validSubcategory) {
    throw new Error("ID de subcategoría no válido");
  }

  return result.data.id;
}

async function getSubcategoriesFromSupabase(): Promise<Subcategory[]> {
  console.log("🔍 Obteniendo subcategorías de Supabase...");

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .not("parent_id", "is", null)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Error obteniendo categorías:", error);
    throw new Error("Error obteniendo categorías de la base de datos");
  }

  console.log("📊 Subcategorías obtenidas:", data?.length || 0);
  console.log("📋 Datos:", data);

  return data || [];
}
