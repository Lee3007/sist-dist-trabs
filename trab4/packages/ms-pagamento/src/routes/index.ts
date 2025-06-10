import { Router, Request, Response } from "express";
import axios from "axios";
import { processPayment } from "@/process-payment";
import { bookingRepository } from "@/repositories/booking.repository";

const router = Router();

router.post("/payments", async (req: Request, res: Response) => {
  const { email, fullName, address } = req.body;
  if (!email || !fullName || !address) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const response = await axios.post("http://localhost:3100/payments", {
      email,
      fullName,
      address,
    });
    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create payment",
      error: (error as Error).message,
    });
  }
});

router.post("/payments-webhook", async (req: Request, res: Response) => {
  const { id, status } = req.body;

  try {
    const booking = await bookingRepository.findByPaymentId(id);
    if (!booking) {
      console.log("Booking not found for payment ID:", id);
      return res
        .status(200)
        .json({ message: "Payment processed successfully" });
    }
    booking.status = status;
    await processPayment(booking);

    res.status(200).json({ message: "Payment processed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create payment",
      error: (error as Error).message,
    });
  }
});

export default router;
