import { useEffect, useState } from "react";
import { getBooking } from "../../services/get-booking";
import { useParams } from "react-router-dom";

export type Booking = {
  id: number;
  tripId: number;
  numPassengers: number;
  numCabins: number;
  paymentLink: string;
  status: string;
  createdAt: string;
  trip: {
    id: number;
    itineraryId: number;
    departureDate: string;
    discount: number;
    itinerary: {
      id: number;
      destination: string;
      embarkPort: string;
      disembarkPort: string;
      visitedPlaces: string;
      duration: number;
      pricePerPerson: number;
      shipName: string;
    };
  };
};

function getProgress(status: string) {
  switch (status) {
    case "PENDING":
      return 60;
    case "APPROVED":
    case "TICKET_ISSUED":
    case "REJECTED":
      return 100;
    default:
      return 0;
  }
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBooking = async () => {
      const data = await getBooking(id!);
      if (isMounted) setBooking(data);
    };
    fetchBooking();
    const interval = setInterval(fetchBooking, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-[#fff7ed] to-[#ffe0b2] flex flex-col items-center px-4 py-6">
      <header className="mb-10 flex flex-col items-center">
        <h1 className="font-serif text-6xl font-extrabold bg-gradient-to-r from-[#FF6F00] to-[#FFA400] bg-clip-text text-transparent tracking-tight drop-shadow-lg">
          Cruzeiros Net
        </h1>
        {/* <div className="flex items-center gap-0 mb-4">
          <span className="text-lg font-serif font-semibold italic text-[#FF6F00]">
            Payment
          </span>
          <span
            className="text-xs text-[#FF6F00] ml-1"
            style={{ lineHeight: 1 }}
          >
            ®
          </span>
        </div> */}
      </header>
      <div className="bg-white/70 rounded-xl shadow-lg p-8 w-full max-w-md backdrop-blur">
        <h2 className="text-2xl font-bold text-center text-[#FF6F00]">
          Progresso da Reserva
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Acompanhe o status do seu pagamento e reserva
        </p>
        {booking ? (
          <>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  booking.status === "APPROVED" ||
                  booking.status === "TICKET_ISSUED"
                    ? "bg-green-500"
                    : booking.status === "REJECTED"
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${getProgress(booking.status)}%` }}
              />
            </div>
            <p className="text-center text-lg mb-2">
              Status:{" "}
              <span
                className={
                  booking.status === "APPROVED" ||
                  booking.status === "TICKET_ISSUED"
                    ? "text-green-600"
                    : booking.status === "REJECTED"
                    ? "text-red-600"
                    : "text-blue-600"
                }
              >
                {booking.status === "PENDING"
                  ? "Pendente"
                  : booking.status === "APPROVED"
                  ? "Aprovado"
                  : booking.status === "TICKET_ISSUED"
                  ? "Bilhete Emitido"
                  : booking.status === "REJECTED"
                  ? "Rejeitado"
                  : booking.status}
              </span>
            </p>
            <p className="text-center text-gray-500 mb-4">
              {booking.status === "PENDING"
                ? `Seu pagamento está sendo processado...`
                : booking.status === "APPROVED"
                ? "Sua reserva foi aprovada com sucesso!"
                : booking.status === "TICKET_ISSUED"
                ? "Seu bilhete foi emitido com sucesso!"
                : booking.status === "REJECTED"
                ? "Houve um problema com sua reserva."
                : ""}
            </p>
            <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-700">
              <div className="mb-2">
                <span className="font-semibold">Reserva:</span> #{booking.id}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Data da Reserva:</span>{" "}
                {new Date(booking.createdAt).toLocaleString("pt-BR")}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Destino:</span>{" "}
                {booking.trip.itinerary.destination}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Navio:</span>{" "}
                {booking.trip.itinerary.shipName}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Porto de Embarque:</span>{" "}
                {booking.trip.itinerary.embarkPort}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Porto de Desembarque:</span>{" "}
                {booking.trip.itinerary.disembarkPort}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Data de Partida:</span>{" "}
                {new Date(booking.trip.departureDate).toLocaleDateString(
                  "pt-BR"
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Duração:</span>{" "}
                {booking.trip.itinerary.duration} dias
              </div>
              <div className="mb-2">
                <span className="font-semibold">Passageiros:</span>{" "}
                {booking.numPassengers}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Cabines:</span>{" "}
                {booking.numCabins}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Preço por Pessoa:</span>{" "}
                {booking.trip.itinerary.pricePerPerson.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
              {booking.trip.discount > 0 && (
                <div className="mb-2">
                  <span className="font-semibold">Desconto:</span>{" "}
                  {booking.trip.discount}%
                </div>
              )}
              <div className="mb-2">
                <span className="font-semibold">Locais Visitados:</span>{" "}
                {booking.trip.itinerary.visitedPlaces}
              </div>
              {/* <div className="mt-4 text-center">
                <a
                  href={booking.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-[#FF6F00] text-white rounded hover:bg-[#FFA400] transition"
                >
                  Ver Link de Pagamento
                </a>
              </div> */}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400 py-8">
            Carregando status do pagamento...
          </p>
        )}
      </div>
    </div>
  );
}
