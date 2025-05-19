import axios from "axios";

const API_URL = "http://localhost:3001/api/promotions/";

export interface CreatePromotionPayload {
  destination: string;
}

export async function createPromotion(payload: CreatePromotionPayload) {
  const response = await axios.post(API_URL, payload);
  return response.status >= 200 && response.status < 300;
}
