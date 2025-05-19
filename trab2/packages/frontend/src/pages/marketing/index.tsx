import { useState } from "react";
import { createPromotion } from "../../services/create-promotion";

// Simple toast component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow z-50 animate-fade-in">
      {message}
      <button className="ml-4" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default function MarketingPage() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#fff7ed] to-[#ffe0b2] px-4">
      {toast && (
        <Toast
          message="Promoção enviada com sucesso!"
          onClose={() => setToast(false)}
        />
      )}
      <div className="bg-white/80 rounded-xl shadow-lg p-8 flex flex-col items-center w-full max-w-md">
        <h1 className="font-serif text-4xl font-extrabold bg-gradient-to-r from-[#FF6F00] to-[#FFA400] bg-clip-text text-transparent mb-4">
          Marketing
        </h1>
        <p className="text-lg text-[#232528]/70 font-light mb-8">
          Publique as promoções:
        </p>
        <div className="w-full flex gap-4">
          <input
            type="text"
            placeholder="Destino"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border-none bg-[#fff7ed] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFA400] transition"
          />
          <button
            type="button"
            className="bg-gradient-to-r from-[#FF6F00] to-[#FFA400] text-white font-semibold px-6 py-2 rounded-lg shadow hover:brightness-110 transition disabled:opacity-60"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setTimeout(async () => {
                const success = await createPromotion({
                  destination: inputValue,
                });
                setLoading(false);
                if (success) {
                  setToast(true);
                  setTimeout(() => setToast(false), 3000);
                  setInputValue("");
                }
              }, 1000);
            }}
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
