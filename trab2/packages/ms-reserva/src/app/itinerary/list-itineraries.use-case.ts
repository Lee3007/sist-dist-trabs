import { Itinerary } from "@/models";
import { ItineraryRepository } from "../../repositories/itinerary.repository";

export interface ListItinerariesFilter {
  destination?: string;
  departureDate?: Date;
  embarkPort?: string;
}

export class ListItinerariesUseCase {
  constructor(private readonly itineraryRepository: ItineraryRepository) {}

  async execute(
    filter: ListItinerariesFilter,
    page: number,
    limit: number
  ): Promise<Itinerary[]> {
    const itineraries = await this.itineraryRepository.findFiltered(
      {
        destination: filter.destination,
        embarkPort: filter.embarkPort,
      },
      page,
      limit
    );
    if (!filter.departureDate) {
      return itineraries;
    }
    const departureDate = new Date(filter.departureDate);
    return itineraries.filter((itinerary) => {
      return itinerary.trips.some((trip) => {
        const tripDate = new Date(trip.departureDate);
        return (
          tripDate.getFullYear() === departureDate.getFullYear() &&
          tripDate.getMonth() === departureDate.getMonth() &&
          tripDate.getDate() === departureDate.getDate()
        );
      });
    });
  }
}
