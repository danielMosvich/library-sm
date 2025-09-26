import supabase from "../supabase/config";

// 🔤 Función para generar SKU
function generateSKU(
  productName: string,
  variantName: string,
  brandName?: string
): string {
  const clean = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

  const brand = brandName ? clean(brandName) : "";
  const product = clean(productName);
  const variant = clean(variantName);

  const pickChars = (str: string): string => {
    if (!str) return "";
    const mid = Math.floor(str.length / 2);
    return str[0] + str[mid] + str[str.length - 1];
  };

  const brandPart =
    brand.length >= 2 ? brand[0] + brand[brand.length - 1] : brand;
  const productPart = pickChars(product);
  const variantPart = pickChars(variant);

  // sufijo aleatorio de 4 dígitos no repetidos
  const digits = Array.from({ length: 10 }, (_, i) => i.toString());
  let randomDigits = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * digits.length);
    randomDigits += digits[idx];
    digits.splice(idx, 1);
  }

  return `${brandPart}${productPart}${variantPart}${randomDigits}`;
}

// 🛠️ Función para insertar con reintentos
export async function generateUniqueSKU(
  productName: string,
  variantName: string,
  brandName?: string
): Promise<string> {
  let attempts = 0;

  while (attempts < 5) {
    const sku = generateSKU(productName, variantName, brandName);

    const { data, error } = await supabase
      .from("product_variants")
      .select("sku")
      .eq("sku", sku)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // no existe en la DB, podemos usarlo
      return sku;
    }

    attempts++;
  }

  throw new Error("No se pudo generar un SKU único tras varios intentos");
}
