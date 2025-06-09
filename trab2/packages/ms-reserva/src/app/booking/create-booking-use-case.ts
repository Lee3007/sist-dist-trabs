import { Booking } from "@/models";
import { BookingRepository } from "../../repositories/booking.repository";
import { sendBookingCreatedMessage } from "../producers/booking.producer";

export interface CreateBookingDTO {
  tripId: number;
  numPassengers: number;
  numCabins: number;
  email: string;
}

export interface CreateBookingResponse {
  paymentLink: string;
}

export class CreateBookingUseCase {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(data: CreateBookingDTO): Promise<CreateBookingResponse> {
    const newBooking: Omit<Booking, "id"> = {
      ...data,
      paymentLink: "",
      status: "PENDING",
      createdAt: new Date(),
    };

    const booking = await this.bookingRepository.create(newBooking);
    const paymentLink = `http://localhost:5173/payment/${booking.id}`;
    this.bookingRepository.update(booking.id, {
      paymentLink,
    });

    await sendBookingCreatedMessage(
      JSON.stringify({ ...booking, paymentLink })
    );
    return { paymentLink };
  }
}
