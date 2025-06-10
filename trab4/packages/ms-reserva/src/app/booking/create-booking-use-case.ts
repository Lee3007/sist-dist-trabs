import { Booking } from "@/models";
import { BookingRepository } from "../../repositories/booking.repository";
import { sendBookingCreatedMessage } from "../producers/booking.producer";
import axios from "axios";

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
    const paymentPayload = {
      email: data.email,
      fullName: "Booking User",
      address: "Unknown Address",
    };
    let paymentLink = "";
    let paymentId;
    try {
      const response = await axios.post(
        "http://localhost:3003/payments",
        paymentPayload
      );
      paymentLink = response.data.link || "";
      paymentId = response.data.id;
    } catch (error) {
      throw new Error("Failed to create payment: " + (error as Error).message);
    }

    const newBooking: Omit<Booking, "id"> = {
      ...data,
      paymentLink: "",
      status: "PENDING",
      createdAt: new Date(),
      externalPaymentId: paymentId,
    };

    const booking = await this.bookingRepository.create(newBooking);

    this.bookingRepository.update(booking.id, {
      paymentLink,
      externalPaymentId: paymentId,
    });

    await sendBookingCreatedMessage(
      JSON.stringify({ ...booking, paymentLink })
    );
    return { paymentLink };
  }
}
