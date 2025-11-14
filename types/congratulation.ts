/**
 * Congratulation Entry Type
 * Represents a congratulations page entry stored in MongoDB
 */
export interface CongratulationEntry {
  _id?: string;
  id: string;
  name: string;
  message?: string;
  postUrl?: string;
  imageUrl?: string;
  createdAt: Date;
}

/**
 * Form data for creating a new congratulation
 */
export interface CongratulationFormData {
  name: string;
  message?: string;
  postUrl?: string;
  image?: File | null;
}

/**
 * API Response for congratulation creation
 */
export interface CreateCongratulationResponse {
  success: boolean;
  id: string;
  url: string;
  message?: string;
  error?: string;
}

/**
 * API Response for congratulation retrieval
 */
export interface GetCongratulationResponse {
  success: boolean;
  data?: CongratulationEntry;
  error?: string;
}
