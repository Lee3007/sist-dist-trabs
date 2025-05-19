import axios from "axios";

interface ListItinerariesParams {
  destination?: string;
  departureDate?: string;
  embarkPort?: string;
}

export async function listItineraries(params: ListItinerariesParams = {}) {
  // Remove keys with empty string values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== "")
  );

  const response = await axios.get("http://localhost:3000/itineraries", {
    params: filteredParams,
  });
  return response.data;
}
