import { Trip } from "@/models";
import { prisma } from "../prisma";

export class TripRepository {
  async findById(id: number): Promise<Trip | null> {
    return prisma.trip.findUnique({ where: { id } });
  }

  async update(id: number, data: Partial<Omit<Trip, "id">>): Promise<Trip> {
    return prisma.trip.update({
      where: { id },
      data,
    });
  }
}

export const tripRepository = new TripRepository();
