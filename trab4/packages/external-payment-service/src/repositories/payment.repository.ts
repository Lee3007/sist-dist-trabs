import { Payment } from "@/models";
import { prisma } from "../prisma";

export class PaymentRepository {
  async create(data: Omit<Payment, "id">): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  async findById(id: number): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { id } });
  }

  async findAll(): Promise<Payment[]> {
    return prisma.payment.findMany();
  }

  async update(
    id: number,
    data: Partial<Omit<Payment, "id">>
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Payment> {
    return prisma.payment.delete({ where: { id } });
  }
}

export const paymentRepository = new PaymentRepository();
