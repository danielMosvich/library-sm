import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import supabase from "../supabase/config";
import Icons from "./Icons";

// Simulamos la estructura de tu BD basada en database.types.ts
export interface Color {
  id: number;
  name: string;
  hex_code: string | null;
  alt_names: string[] | null;
  active: boolean;
}

interface ColorComboboxProps {
  value?: number | null; // seguimos recibiendo el id seleccionado
  onColorSelect: (color: Color | null) => void; // ahora devuelve el objeto completo
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

// Función para consultar a Supabase
const fetchColorsFromDB = async (): Promise<Color[]> => {
  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .eq("active", true) // solo colores activos
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data || [];
};

export default function ColorCombobox({
  value,
  onColorSelect,
  placeholder = "Selecciona un color",
  disabled = false,
  className = "",
  label,
  error,
}: ColorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Query para cargar colores
  const {
    data: colors,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["colors"],
    queryFn: fetchColorsFromDB,
  });

  // Obtener el color seleccionado
  const selectedColor = colors?.find((c) => c.id === value) || null;

  // Filtrar colores basado en búsqueda
  const filteredColors = (colors || []).filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.alt_names &&
        c.alt_names.some((alt) =>
          alt.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".color-combobox-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleColorSelect = (color: Color | null) => {
    onColorSelect(color); // ahora enviamos el objeto completo
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onColorSelect(null); // limpiamos el valor
    setSearchTerm("");
  };

  const handleInputFocus = () => {
    // Solo abrir dropdown si NO hay color seleccionado
    if (!selectedColor) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Solo abrir dropdown si NO hay color seleccionado
    if (!selectedColor) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    // Solo abrir dropdown si NO hay color seleccionado
    if (!selectedColor && !disabled) {
      setIsOpen(true);
    }
  };

  // Manejo de error de la query
  if (queryError) {
    return (
      <div className={`color-combobox-container relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="text-error text-sm">
          Error cargando colores: {queryError.message}
        </div>
      </div>
    );
  }

  const ColorBadge = ({
    color,
    size = "sm",
  }: {
    color: Color;
    size?: "xs" | "sm" | "md";
  }) => {
    const sizeClasses = {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-6 h-6",
    };

    if (!color.hex_code) {
      return (
        <div
          className={`${sizeClasses[size]} border-2 border-gray-400 border-dashed rounded-full flex items-center justify-center`}
        >
          <span className="text-xs text-gray-400">T</span>
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} rounded-full border border-gray-300 flex-shrink-0`}
        style={{ backgroundColor: color.hex_code }}
        title={`Color: ${color.name}`}
      />
    );
  };

  return (
    <div className={`color-combobox-container relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Input principal */}
        <div
          className={`input input-bordered w-full flex items-center gap-3 min-h-[3rem] relative
            ${disabled ? "input-disabled" : ""}
            ${error ? "input-error" : ""}
            ${selectedColor ? "pr-12 cursor-default" : "cursor-pointer"}`}
          onClick={handleInputClick}
        >
          {selectedColor && <ColorBadge color={selectedColor} size="md" />}

          <input
            type="text"
            className={`flex-1 bg-transparent outline-none ${
              selectedColor ? "cursor-default" : "cursor-pointer"
            }`}
            value={selectedColor ? selectedColor.name : searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={!!selectedColor} // cuando hay color seleccionado, es solo lectura
          />

          {/* Botón de limpiar selección */}
          {selectedColor && !disabled && (
            <button
              type="button"
              className="btn btn-sm btn-square absolute right-2"
              onClick={handleClearSelection}
              title="Limpiar selección"
            >
              <Icons variant="close" />
            </button>
          )}

          {/* Icono dropdown */}
          {!selectedColor && (
            <div
              className={` transition-transform duration-200 absolute right-3 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <Icons variant="down" width="1.5rem" height="1.5rem" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-base-100 border border-base-300 rounded-lg max-h-64 overflow-hidden shadow-lg">
            {selectedColor && (
              <div className="p-3 border-b border-base-300">
                <input
                  type="text"
                  className="input input-sm input-bordered w-full"
                  placeholder="Buscar otro color..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  autoFocus
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span className="ml-2">Cargando colores...</span>
                </div>
              ) : filteredColors.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm
                    ? `No se encontraron colores para "${searchTerm}"`
                    : "No hay colores disponibles"}
                </div>
              ) : (
                <>
                  {selectedColor && (
                    <div
                      className="p-3 hover:bg-error/10 cursor-pointer border-b border-base-300 flex items-center gap-3 text-error"
                      onClick={() => handleColorSelect(null)}
                    >
                      <div className="w-6 h-6 border-2 border-error border-dashed rounded-full flex items-center justify-center">
                        <span className="text-sm">✕</span>
                      </div>
                      <span className="font-medium">Quitar color</span>
                    </div>
                  )}

                  {filteredColors.map((c) => (
                    <div
                      key={c.id}
                      className={`py-2 px-4 hover:bg-primary/10 cursor-pointer border-b border-base-300/50 last:border-b-0 flex items-center gap-3 transition-colors ${
                        selectedColor?.id === c.id
                          ? "bg-primary/20 border-primary/30"
                          : ""
                      }`}
                      onClick={() => handleColorSelect(c)}
                    >
                      <ColorBadge color={c} size="md" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{c.name}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span className="text-error text-sm mt-1">{error}</span>}
    </div>
  );
}
