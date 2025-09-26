import { useProductStore } from "../../../../app/store/product/useProductStore";

export default function ProductAddHeader() {
  // zustand store
  const {
    toggleAiOptions,
    toggleDefaultPrices,
    aiOptionsEnabled,
    defaultPricesEnabled,
  } = useProductStore();
  return (
    <div className="bg-base-200 rounded-box p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Configuración</h3>
      <div className="flex flex-wrap gap-6">
        {/* Toggle para opciones de IA */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text mr-3">Opciones con IA</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={aiOptionsEnabled}
              onChange={toggleAiOptions}
            />
          </label>
        </div>

        {/* Toggle para precios por defecto */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text mr-3">Precios por defecto</span>
            <input
              type="checkbox"
              className="toggle toggle-secondary"
              checked={defaultPricesEnabled}
              onChange={toggleDefaultPrices}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
