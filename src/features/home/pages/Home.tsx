import { useState } from "react";
import BarcodeScanner from "react-qr-barcode-scanner";
export default function Home() {
  const [data, setData] = useState<string | null>(null);
  const [stopStream, setStopStream] = useState(false);
  const [modal, setModal] = useState(false);
  return (
    <div>
      {/* Open the modal using document.getElementById('ID').showModal() method */}
      <button className="btn" onClick={() => setModal(true)}>
        open modal
      </button>
      {modal && (
        <dialog
          id="my_modal_5"
          className="modal modal-bottom sm:modal-middle"
          open
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg">Hello!</h3>
            <BarcodeScanner
              width={500}
              height={500}
              stopStream={stopStream}
              onUpdate={(err, result) => {
                if (result) {
                  const text = result.getText();
                  console.log(text);
                  setData(text);
                } else {
                  console.log("No se pudo escanear el código", err);
                }
              }}
            />
            {data && <p>Datos escaneados: {data}</p>}
            <button className="btn" type="button" onClick={() => setData(null)}>
              CLEAN
            </button>
            <button
              className="btn"
              onClick={() => setStopStream((prev) => !prev)}
            >
              TOGGLE
            </button>
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
          </div>
        </dialog>
      )}
    </div>
    // <div>
    //   <h1>Bienvenido a la Biblioteca</h1>

    // </div>
  );
}
