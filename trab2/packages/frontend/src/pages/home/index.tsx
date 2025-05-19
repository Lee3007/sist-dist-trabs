import { useEffect, useState } from "react";
import { listItineraries } from "../../services/list-itineraries";
import imagesUrls from "./imagesUrls";
import ItineraryListItem from "./itinerary-list-item";

interface Filters {
  destination?: string;
  departureDate?: string;
  embarkPort?: string;
}

export default function HomePage() {
  const [itineraries, setItineraries] = useState([]);
  const [filters, setFilters] = useState<Filters>({});
  const [randomNumber, setRandomNumber] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      async function fetchItineraries() {
        const fetchedItineraries = await listItineraries({
          destination: filters.destination,
          departureDate: filters.departureDate,
          embarkPort: filters.embarkPort,
        });
        setItineraries(fetchedItineraries);
      }
      fetchItineraries();
      setRandomNumber(Math.floor(Math.random() * imagesUrls.length));
    }, 500);

    return () => clearTimeout(handler);
  }, [filters]);

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-[#fff7ed] to-[#ffe0b2] flex flex-col items-center px-4 py-6">
      <header className="mb-10 flex flex-col items-center">
        <h1 className="font-serif text-6xl font-extrabold bg-gradient-to-r from-[#FF6F00] to-[#FFA400] bg-clip-text text-transparent tracking-tight mb-2 drop-shadow-lg">
          Cruzeiros Net
        </h1>
        <p className="text-lg text-[#232528]/70 font-light">
          Encontre o cruzeiro perfeito para suas férias
        </p>
      </header>
      <form
        className="flex flex-col md:flex-row gap-4 w-full max-w-[50vw] mb-10 bg-white/70 rounded-xl shadow-lg p-6 backdrop-blur"
        autoComplete="off"
      >
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Destino"
            value={filters.destination || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, destination: e.target.value }))
            }
            className="w-full border-none bg-[#fff7ed] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFA400] transition"
          />
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="date"
            placeholder="Data de partida"
            value={filters.departureDate || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, departureDate: e.target.value }))
            }
            className="w-full border-none bg-[#fff7ed] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFA400] transition"
          />
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Porto de embarque"
            value={filters.embarkPort || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, embarkPort: e.target.value }))
            }
            className="w-full border-none bg-[#fff7ed] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFA400] transition"
          />
        </div>
      </form>
      <ul className="w-full max-w-[70vw] space-y-6">
        {itineraries.length === 0 ? (
          <li className="text-gray-400 text-center py-12 bg-white/60 rounded-xl shadow-inner">
            Nenhum itinerário encontrado.
          </li>
        ) : (
          itineraries.map((itinerary: any, index: number) => (
            <ItineraryListItem
              key={index}
              itinerary={itinerary}
              imageNumber={randomNumber}
              index={index}
            />
          ))
        )}
      </ul>
    </div>
  );
}
