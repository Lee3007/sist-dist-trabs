import { Router } from "express";
import { publishPromotion } from "./publish-promotion";

const router = Router();

router.post("/api/promotions", async (req, res) => {
  try {
    const { destination, title, discount } = req.body;

    await publishPromotion(destination, title, +discount);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Failed to create promotion:", error);
    res.status(500).json({ error: "Failed to create promotion" });
  }
});

export default router;
