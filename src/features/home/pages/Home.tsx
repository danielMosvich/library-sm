import { useState } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";
export default function Home() {
  const [data, setData] = useState<string | null>(null);
  return (
    <div>
      <h1>Bienvenido a la Biblioteca</h1>
      <BarcodeScanner
        width={500}
        height={500}
        onUpdate={(err, result) => {
          if (result) {
            const text = result.getText();
            console.log(text);
            setData(text);
          }
        }}
      />
      {data && <p>Datos escaneados: {data}</p>}
      <button type="button" onClick={() => setData(null)}>
        CLEAN
      </button>
    </div>
  );
}
