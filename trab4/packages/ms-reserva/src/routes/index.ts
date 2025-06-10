import { CreateBookingUseCase } from "@/app/booking/create-booking-use-case";
import { ListItinerariesUseCase } from "@/app/itinerary/list-itineraries.use-case";
import { itineraryRepository } from "@/repositories/itinerary.repository";
import { bookingRepository } from "@/repositories/booking.repository";
import { Router, Request, Response } from "express";
import axios from "axios";
import { sendBookingCanceledMessage } from "@/app/producers/booking.producer";

const router = Router();

router.get("/itineraries", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const destination = req.query.destination as string;
  const embarkPort = req.query.embarkPort as string;
  const departureDate = req.query.departureDate as string;

  const params: Record<string, string | number> = {
    page,
    limit,
  };
  if (destination) params.destination = destination;
  if (embarkPort) params.embarkPort = embarkPort;
  if (departureDate) params.departureDate = departureDate;

  try {
    console.log("Fetching itineraries with http://localhost:3002/itineraries");
    const response = await axios.get("http://localhost:3002/itineraries", {
      params,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch itineraries",
      error: (error as Error).message,
    });
  }
});

router.post("/booking", async (req: Request, res: Response) => {
  const createBookingUseCase = new CreateBookingUseCase(bookingRepository);

  const bookingDetails = req.body;

  const booking = await createBookingUseCase.execute(bookingDetails);

  res.status(201).json({ message: "Booking created", ...booking });
});

router.post("/booking/cancel/:id", async (req: Request, res: Response) => {
  const booking = await bookingRepository.findById(+req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  await bookingRepository.update(booking.id, {
    status: "CANCELED",
  });
  await sendBookingCanceledMessage(JSON.stringify(booking));

  res.status(200).json({ message: "Booking canceled", ...booking });
});

router.get("/booking/:email", (req: Request, res: Response, next) => {
  (async () => {
    const email = req.params.email as string;
    if (!email) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required" });
    }

    const bookings = await bookingRepository.findManyByEmail(email);

    res.json(bookings);
  })().catch(next);
});

router.get("/booking/id/:id", (req: Request, res: Response, next) => {
  (async () => {
    const id = +req.params.id as number;
    if (!id) {
      return res.status(400).json({ message: "Id is required" });
    }
    console.log("Fetching booking with ID:", id);
    const booking = await bookingRepository.findById(id);
    console.log("Booking found:", booking);
    res.json(booking);
  })().catch(next);
});

export default router;
