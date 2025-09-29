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
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/\s+/g, "") // Eliminar espacios y whitespace
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

// 🚀 Función optimizada para generar múltiples SKUs únicos en batch
export async function generateUniqueSKUsBatch(
  variants: Array<{ idx: number; unit: string }>,
  productName: string,
  brandName?: string
): Promise<Map<number, string>> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    // 1. Generar todos los SKUs de una vez y crear Map
    const skusMap = new Map<number, string>();
    const skusArray: string[] = [];

    variants.forEach((v) => {
      const sku = generateSKU(productName, v.unit, brandName);
      skusMap.set(v.idx, sku);
      skusArray.push(sku);
    });

    // 2. Verificar duplicados locales (dentro del mismo batch)
    const uniqueSkus = new Set(skusArray);
    if (uniqueSkus.size !== skusArray.length) {
      // Hay duplicados locales, reintentar
      attempts++;
      continue;
    }

    // 3. Verificar en BD con una sola consulta
    const { data: existingSKUs, error } = await supabase
      .from("product_variants")
      .select("sku")
      .in("sku", skusArray);

    if (error) throw error;

    // 4. Si no hay conflictos, retornar el Map completo
    if (!existingSKUs || existingSKUs.length === 0) {
      return skusMap;
    }

    // 5. Si hay conflictos, reintentar solo si no es el último intento
    attempts++;
    if (attempts >= maxAttempts) {
      // Como último recurso, usar el método individual para los conflictivos
      const existingSet = new Set(existingSKUs.map((item) => item.sku));
      const finalMap = new Map<number, string>();

      for (const variant of variants) {
        const currentSku = skusMap.get(variant.idx)!;
        if (existingSet.has(currentSku)) {
          // Generar uno nuevo individualmente
          const newSKU = await generateUniqueSKU(
            productName,
            variant.unit,
            brandName
          );
          finalMap.set(variant.idx, newSKU);
        } else {
          finalMap.set(variant.idx, currentSku);
        }
      }

      return finalMap;
    }
  }

  throw new Error("No se pudo generar SKUs únicos tras varios intentos");
}
