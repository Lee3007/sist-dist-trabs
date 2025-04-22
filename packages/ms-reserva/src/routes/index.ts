import { CreateBookingUseCase } from "@/app/booking/create-booking-use-case";
import { ListItinerariesUseCase } from "@/app/itinerary/list-itineraries.use-case";
import { itineraryRepository } from "@/repositories/itinerary.repository";
import { bookingRepository } from "@/repositories/booking.repository";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/itineraries", async (req: Request, res: Response) => {
  const listItinerariesUseCase = new ListItinerariesUseCase(
    itineraryRepository
  );
  const itineraries = await listItinerariesUseCase.execute(req.query);
  res.json(itineraries);
});

router.post("/booking", async (req: Request, res: Response) => {
  const createBookingUseCase = new CreateBookingUseCase(bookingRepository);

  const bookingDetails = req.body;

  const booking = await createBookingUseCase.execute(bookingDetails);

  res.status(201).json({ message: "Booking created", details: booking });
});

export default router;
