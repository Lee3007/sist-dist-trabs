/*
  Warnings:

  - Added the required column `email` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "email" TEXT NOT NULL;
