import { CreateBookingUseCase } from "@/app/booking/create-booking-use-case";
import { bookingRepository } from "@/repositories/booking.repository";
import { Router, Request, Response } from "express";
import axios from "axios";
import { sendBookingCanceledMessage } from "@/app/producers/booking.producer";
import {
  addSseClient,
  removeSseClient,
  sendSseUpdate,
} from "@/app/sse/booking";
import {
  getUserInterests,
  addSseClient as addMarketingSseClient,
  removeSseClient as removeMarketingSseClient,
  removeUserInterest,
  registerUserInterest,
} from "@/app/sse/marketing";

const router = Router();

router.get("/booking/stream/:id", (req: Request, res: Response) => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    return res.status(400).send("Invalid booking ID");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  res.write("data: Connected to booking stream\n\n");

  res.flushHeaders();

  addSseClient(bookingId, res);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(bookingId, res);
    res.end();
  });
});

router.get("/marketing/stream/:email", (req: Request, res: Response) => {
  const email = req.params.email;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email path parameter is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

  res.write("data: Connected to marketing stream\n\n");

  res.flushHeaders();

  addMarketingSseClient(email, res);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeMarketingSseClient(email);
    res.end();
  });
});

router.post("/marketing", (req: Request, res: Response) => {
  const { email, destination } = req.body;
  if (!email || !destination) {
    return res.status(400).json({ message: "Parameters missing" });
  }

  try {
    registerUserInterest(email, destination);
    res.status(201).json({ message: "User interest registered" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register user interest",
      error: (error as Error).message,
    });
  }
});

router.delete("/marketing", (req: Request, res: Response) => {
  const email = req.query.email as string;
  const destination = req.query.destination as string;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email query parameter is required" });
  }

  try {
    removeUserInterest(email, destination);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch marketing list",
      error: (error as Error).message,
    });
  }
});
router.get("/marketing/list", (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    return res
      .status(400)
      .json({ message: "Email query parameter is required" });
  }

  try {
    const interestedDestinations = getUserInterests(email);
    res.json(interestedDestinations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch marketing list",
      error: (error as Error).message,
    });
  }
});

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
  const bookingId = +req.params.id;
  const booking = await bookingRepository.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const updatedBooking = await bookingRepository.update(booking.id, {
    status: "CANCELED",
  });

  await sendBookingCanceledMessage(JSON.stringify(updatedBooking));

  sendSseUpdate(bookingId, updatedBooking);

  res.status(200).json({ message: "Booking canceled", ...updatedBooking });
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
