import { ListItinerariesUseCase } from "@/app/itinerary/list-itineraries.use-case";
import { itineraryRepository } from "@/repositories/itinerary.repository";
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

export default router;
