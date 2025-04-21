import { ListItinerariesUseCase } from "@/app/itinerary/list-itineraries.use-case";
import { itineraryRepository } from "@/repositories/itinerary.repository";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/itineraries", async (req: Request, res: Response) => {
  const listItinerariesUseCase = new ListItinerariesUseCase(
    itineraryRepository
  );
  const itineraries = await listItinerariesUseCase.execute({});
  res.json(itineraries);
});

export default router;
