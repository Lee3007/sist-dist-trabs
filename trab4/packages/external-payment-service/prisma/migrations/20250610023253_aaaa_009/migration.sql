/*
  Warnings:

  - A unique constraint covering the columns `[external_payment_id]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bookings_external_payment_id_key" ON "bookings"("external_payment_id");
