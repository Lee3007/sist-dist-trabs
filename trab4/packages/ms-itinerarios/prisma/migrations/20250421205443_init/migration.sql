-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'TICKET_ISSUED');

-- CreateTable
CREATE TABLE "itineraries" (
    "id" SERIAL NOT NULL,
    "destination" TEXT NOT NULL,
    "embark_port" TEXT NOT NULL,
    "disembark_port" TEXT NOT NULL,
    "visited_places" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "price_per_person" DOUBLE PRECISION NOT NULL,
    "ship_name" TEXT NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "itinerary_id" INTEGER NOT NULL,
    "departure_date" TIMESTAMP(3) NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "num_passengers" INTEGER NOT NULL,
    "num_cabins" INTEGER NOT NULL,
    "payment_link" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
