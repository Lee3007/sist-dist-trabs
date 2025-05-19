import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export type Booking = {
  id: number;
  tripId: number;
  numPassengers: number;
  numCabins: number;
  paymentLink: string;
  status: string;
  createdAt: string;
  trip: {
    id: number;
    itineraryId: number;
    departureDate: string;
    discount: number;
    itinerary: {
      id: number;
      destination: string;
      embarkPort: string;
      disembarkPort: string;
      visitedPlaces: string;
      duration: number;
      pricePerPerson: number;
      shipName: string;
    };
  };
};

export async function getBooking(id: string): Promise<Booking> {
  try {
    const response = await axios.get(`${API_BASE_URL}/booking/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
