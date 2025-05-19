import { Booking } from "@/models";
import { prisma } from "../prisma";

export class BookingRepository {
  async create(data: Omit<Booking, "id">): Promise<Booking> {
    return prisma.booking.create({ data });
  }

  async findById(id: number): Promise<Booking | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: { trip: { include: { itinerary: true } } },
    });
  }

  async findAll(): Promise<Booking[]> {
    return prisma.booking.findMany();
  }

  async update(
    id: number,
    data: Partial<Omit<Booking, "id">>
  ): Promise<Booking> {
    return prisma.booking.update({
      where: { id },
      data,
    });
  }

  async findFiltered(
    filter: Partial<Booking>,
    page: number = 1,
    limit: number = 20
  ): Promise<Booking[]> {
    const skip = (page - 1) * limit;
    return prisma.booking.findMany({
      where: filter,
      skip,
      take: limit,
    });
  }

  async delete(id: number): Promise<Booking> {
    return prisma.booking.delete({ where: { id } });
  }
}

export const bookingRepository = new BookingRepository();
