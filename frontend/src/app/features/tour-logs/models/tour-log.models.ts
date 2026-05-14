export interface CreateTourLogRequest {
  tourId: string;
  dateTime: string;
  rating: number;
  difficulty: number;
  totalTime: number;
  totalDistance: number;
  comment: string;
}

export interface UpdateTourLogRequest {
  dateTime: string;
  rating: number;
  difficulty: number;
  totalTime: number;
  totalDistance: number;
  comment: string;
}

export interface TourLogResponse {
  id: string;
  tourId: string;
  tourName?: string;
  dateTime: string;
  rating: number;
  difficulty: number;
  totalTime: number;
  totalDistance: number;
  comment: string;
}

export interface TourLogListResponse {
  id: string;
  rating: number;
}
