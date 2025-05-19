import axios from "axios";

interface CreateBookingParams {
  tripId: number;
  numPassengers: number;
  numCabins: number;
}

export async function createBooking(params: CreateBookingParams) {
  const response = await axios.post("http://localhost:3000/booking", {
    tripId: params.tripId,
    numPassengers: params.numPassengers,
    numCabins: params.numCabins,
  });
  return response.data;
}
