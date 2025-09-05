interface ProductAddHeaderProps {
  aiOptionsEnabled: boolean;
  setAiOptionsEnabled: (enabled: boolean) => void;
  defaultPricesEnabled: boolean;
  setDefaultPricesEnabled: (enabled: boolean) => void;
}
export default function ProductAddHeader({
  aiOptionsEnabled,
  setAiOptionsEnabled,
  defaultPricesEnabled,
  setDefaultPricesEnabled,
}: ProductAddHeaderProps) {
  return (
    <div className="bg-base-200 rounded-box p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Configuración</h3>
      <div className="flex flex-wrap gap-6">
        {/* Toggle para opciones de IA */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text mr-3">🤖 Opciones de IA</span>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={aiOptionsEnabled}
              onChange={(e) => setAiOptionsEnabled(e.target.checked)}
            />
          </label>
        </div>

        {/* Toggle para precios por defecto */}
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text mr-3">💰 Precios por defecto</span>
            <input
              type="checkbox"
              className="toggle toggle-secondary"
              checked={defaultPricesEnabled}
              onChange={(e) => setDefaultPricesEnabled(e.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
