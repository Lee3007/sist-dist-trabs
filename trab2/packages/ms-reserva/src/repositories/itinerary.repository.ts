import { Itinerary, Trip } from "@/models";
import { prisma } from "../prisma";

export class ItineraryRepository {
  async create(data: Omit<Itinerary, "id">): Promise<Itinerary> {
    return prisma.itinerary.create({ data });
  }

  async findById(id: number): Promise<Itinerary | null> {
    return prisma.itinerary.findUnique({ where: { id } });
  }

  async findAll(): Promise<Itinerary[]> {
    return prisma.itinerary.findMany();
  }

  async update(
    id: number,
    data: Partial<Omit<Itinerary, "id">>
  ): Promise<Itinerary> {
    return prisma.itinerary.update({
      where: { id },
      data,
    });
  }

  async findFiltered(
    filter: Partial<Itinerary>,
    page: number = 1,
    limit: number = 20
  ): Promise<(Itinerary & { trips: Trip[] })[]> {
    const skip = (page - 1) * limit;
    // Build the where clause with "contains" for destination and embarkPort
    const where: any = { ...filter };
    if (filter.destination) {
      where.destination = { contains: filter.destination, mode: "insensitive" };
    }
    if (filter.embarkPort) {
      where.embarkPort = { contains: filter.embarkPort, mode: "insensitive" };
    }
    return prisma.itinerary.findMany({
      where,
      skip,
      take: limit,
      include: {
        trips: true,
      },
    });
  }

  async delete(id: number): Promise<Itinerary> {
    return prisma.itinerary.delete({ where: { id } });
  }
}

export const itineraryRepository = new ItineraryRepository();
