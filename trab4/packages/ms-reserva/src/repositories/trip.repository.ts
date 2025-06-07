import { Trip } from "@/models";
import { prisma } from "../prisma";

export class TripRepository {
  async create(data: Omit<Trip, "id">): Promise<Trip> {
    return prisma.trip.create({ data });
  }

  async findById(id: number): Promise<Trip | null> {
    return prisma.trip.findUnique({ where: { id } });
  }

  async findAll(): Promise<Trip[]> {
    return prisma.trip.findMany();
  }

  async update(id: number, data: Partial<Omit<Trip, "id">>): Promise<Trip> {
    return prisma.trip.update({
      where: { id },
      data,
    });
  }

  async findFiltered(
    filter: Partial<Trip>,
    page: number = 1,
    limit: number = 20
  ): Promise<Trip[]> {
    const skip = (page - 1) * limit;
    return prisma.trip.findMany({
      where: filter,
      skip,
      take: limit,
    });
  }

  async delete(id: number): Promise<Trip> {
    return prisma.trip.delete({ where: { id } });
  }
}

export const tripRepository = new TripRepository();
