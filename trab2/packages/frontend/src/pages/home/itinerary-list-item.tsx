import { useState } from "react";
import imagesUrls from "./imagesUrls";
import { createBooking } from "../../services/create-booking";

interface Props {
  itinerary: any;
  index: number;
  imageNumber: number;
}

export default function ItineraryListItem({
  itinerary,
  index,
  imageNumber,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedNumOfPassengers, setSelectedNumOfPassengers] =
    useState<number>(1);
  const [selectedNumOfCabins, setSelectedNumOfCabins] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  async function handleBooking(
    tripId: number,
    numPassengers: number,
    numCabins: number
  ) {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const response = await createBooking({
        tripId,
        numPassengers,
        numCabins,
      });
      console.log("Booking response:", response);
      if (response?.paymentLink) {
        window.open(response.paymentLink, "_blank");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
    }
    setLoading(false);
  }

  return (
    <li
      key={itinerary.id}
      className="bg-white/90 rounded-2xl shadow-lg hover:shadow-2xl transition p-0 flex overflow-hidden"
    >
      <div className="w-80 flex-shrink-0 bg-red-200">
        <img
          src={imagesUrls[(imageNumber + index) % imagesUrls.length]}
          alt={itinerary.destination}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#FF6F00] mb-2">
            {itinerary.destination}
          </h2>
          <div className="flex flex-col gap-y-1 text-sm text-[#232528]/80 mb-2">
            <span>
              <strong>Navio:</strong> {itinerary.shipName}
            </span>
            <span>
              <strong>Porto embarque:</strong> {itinerary.embarkPort}
            </span>
            <span>
              <strong>Porto retorno:</strong> {itinerary.disembarkPort}
            </span>
            <span>
              <strong>Noites:</strong> {itinerary.duration}
            </span>
            <span>
              <strong>Noites:</strong> {itinerary.duration}
            </span>
            <span>
              <strong>Lugares visitados:</strong> {itinerary.visitedPlaces}
            </span>
          </div>
          <div className="text-sm text-[#232528]/70 mb-2">
            <strong>Selecione uma data disponível:</strong>{" "}
            {Array.isArray(itinerary.trips) && itinerary.trips.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 mt-1">
                  {itinerary.trips.map((trip: any, tripIdx: number) => {
                    const isSelected = selectedDate === trip.departureDate;
                    return (
                      <button
                        key={trip.id || tripIdx}
                        type="button"
                        className={`cursor-pointer px-3 py-1 rounded-full border border-[#FFA400] bg-[#fff7ed] text-[#FF6F00] text-xs font-medium hover:bg-[#FFE0B2] focus:outline-none focus:ring-2 focus:ring-[#FFA400] transition flex items-center ${
                          isSelected
                            ? "bg-[#FFE0B2] ring-2 ring-[#FF6F00] font-bold"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedDate(
                            isSelected ? null : trip.departureDate
                          )
                        }
                      >
                        <span className="flex items-center">
                          {isSelected && (
                            <span
                              className="mr-1 flex items-center"
                              aria-label="Selecionado"
                              title="Selecionado"
                            >
                              ✅
                            </span>
                          )}
                          {new Date(trip.departureDate).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-4">
                  <div>
                    <label
                      className="block text-xs text-[#232528]/70 mb-1"
                      htmlFor={`numPassengers-${index}`}
                    >
                      Passageiros:
                    </label>
                    <select
                      id={`numPassengers-${index}`}
                      className="border border-[#FFA400] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA400] bg-white"
                      value={selectedNumOfPassengers || 1}
                      onChange={(e) =>
                        setSelectedNumOfPassengers(Number(e.target.value))
                      }
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs text-[#232528]/70 mb-1"
                      htmlFor={`numCabins-${index}`}
                    >
                      Cabines:
                    </label>
                    <select
                      id={`numCabins-${index}`}
                      className="border border-[#FFA400] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFA400] bg-white"
                      value={selectedNumOfCabins || 1}
                      onChange={(e) =>
                        setSelectedNumOfCabins(Number(e.target.value))
                      }
                    >
                      {[...Array(5)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              "Não há datas disponíveis"
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          {selectedDate ? (
            (() => {
              const selectedTrip = itinerary.trips.find(
                (trip: any) => trip.departureDate === selectedDate
              );
              const price = itinerary.pricePerPerson;
              const discount = selectedTrip?.discount || 0;
              const finalPrice = price - price * (discount / 100);
              return (
                <span className="text-xl font-bold text-[#FF6F00] flex items-center gap-2">
                  R$ {finalPrice.toFixed(2)}
                  {discount > 0 && (
                    <span className="text-xs text-green-600 bg-green-50 rounded px-2 py-0.5 ml-1">
                      -{discount}%
                    </span>
                  )}
                </span>
              );
            })()
          ) : (
            <span className="text-gray-400 text-sm italic">
              Selecione uma data para ver o preço
            </span>
          )}
          <button
            className="bg-[#FF6F00] hover:bg-[#FFA400] text-white font-semibold px-4 py-1.5 rounded-md shadow transition focus:outline-none focus:ring-2 focus:ring-[#FFA400] text-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
            onClick={() => {
              const selectedTrip = itinerary.trips.find(
                (trip: any) => trip.departureDate === selectedDate
              );
              if (!selectedTrip) return;
              handleBooking(
                selectedTrip.id,
                selectedNumOfPassengers,
                selectedNumOfCabins
              );
            }}
            disabled={!selectedDate || loading}
          >
            {loading ? "Reservando..." : "Reservar"}
          </button>
        </div>
      </div>
    </li>
  );
}
