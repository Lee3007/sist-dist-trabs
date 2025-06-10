import { Router, Request, Response } from "express";
import { paymentRepository } from "@/repositories/payment.repository";
import axios from "axios";

const router = Router();

router.post("/payments", async (req: Request, res: Response) => {
  const { email, fullName, address } = req.body;

  if (!email || !fullName || !address) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const payment = await paymentRepository.create({
      email,
      fullName,
      address,
      status: "PENDING",
      createdAt: new Date(),
    });

    res.status(201).json({
      ...payment,
      link: "http://localhost:8080/payment/" + payment.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create payment",
      error: (error as Error).message,
    });
  }
});

router.get("/payments/:id", async (req: Request, res: Response) => {
  try {
    const payment = await paymentRepository.findById(parseInt(req.params.id));

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payment",
      error: (error as Error).message,
    });
  }
});

router.post("/payments/pay/:id", async (req: Request, res: Response) => {
  try {
    const updated = await paymentRepository.update(parseInt(req.params.id), {
      status: "APPROVED",
    });
    axios.post("http://localhost:3003/payments-webhook", {
      ...updated,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Error approving payment",
      error: (error as Error).message,
    });
  }
});

router.post("/payments/reject/:id", async (req: Request, res: Response) => {
  try {
    const updated = await paymentRepository.update(parseInt(req.params.id), {
      status: "REJECTED",
    });
    axios.post("http://localhost:3003/payments-webhook", {
      ...updated,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting payment",
      error: (error as Error).message,
    });
  }
});

export default router;
