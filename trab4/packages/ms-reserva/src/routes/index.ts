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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const destination = req.query.destination as string;
  const embarkPort = req.query.embarkPort as string;
  const departureDate = req.query.departureDate as string;
  const filter = {
    destination,
    embarkPort,
    departureDate: departureDate ? new Date(departureDate) : undefined,
  };
  const itineraries = await listItinerariesUseCase.execute(filter, page, limit);
  res.json(itineraries);
});

router.post("/booking", async (req: Request, res: Response) => {
  const createBookingUseCase = new CreateBookingUseCase(bookingRepository);

  const bookingDetails = req.body;

  const booking = await createBookingUseCase.execute(bookingDetails);

  res.status(201).json({ message: "Booking created", ...booking });
});

router.get("/booking/:id", (req: Request, res: Response, next) => {
  (async () => {
    const bookingId = Number(req.params.id);
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  })().catch(next);
});

export default router;
