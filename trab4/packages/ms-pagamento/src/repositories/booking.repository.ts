import { Booking } from "@/models";
import { prisma } from "../prisma";

export class BookingRepository {
  async findByPaymentId(id: number): Promise<Booking | null> {
    return prisma.booking.findFirst({
      where: { externalPaymentId: id },
    });
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
}

export const bookingRepository = new BookingRepository();
