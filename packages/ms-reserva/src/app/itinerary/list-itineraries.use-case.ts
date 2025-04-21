import { Itinerary } from "@/models";
import { ItineraryRepository } from "../../repositories/itinerary.repository";

export interface ListItinerariesFilter {
  destination?: string;
  departureDate?: Date;
  embarkationPort?: string;
}

export class ListItinerariesUseCase {
  constructor(private readonly itineraryRepository: ItineraryRepository) {}

  async execute(filter: ListItinerariesFilter): Promise<Itinerary[]> {
    return await this.itineraryRepository.findFiltered(filter);
  }

  async executeWithPagination(
    filter: ListItinerariesFilter,
    page: number,
    limit: number
  ): Promise<Itinerary[]> {
    return await this.itineraryRepository.findFiltered(filter, page, limit);
  }
}
