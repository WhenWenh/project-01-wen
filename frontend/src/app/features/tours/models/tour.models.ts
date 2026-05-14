export type TourType = 'BIKE' | 'HIKE' | 'RUNNING' | 'VACATION';

export interface CreateTourRequest {
  name: string;
  description: string;
  imagePath: string;
  tourType: TourType;
  startName: string;
  endName: string;
}

export interface TourResponse {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  tourType: TourType;
  startName: string;
  endName: string;
}

export interface TourWithFavoriteResponse extends TourResponse {
  favorite: boolean;
}

export interface TourRouteResponse {
  distance: number;
  duration: number;
  coordinates: number[][];
}

export interface TourListResponse {
  id: string;
  name: string;
}

export interface TourFilteredListResponse {
  id: string;
  name: string;
  tourType: TourType;
}

export interface TourListItem {
  id: string;
  name: string;
  tourType?: TourType;
  isFavorite: boolean;
}

export interface CreateTourSaveResult {
  status: 'success' | 'error';
  title: string;
  message: string;
  tourId?: string;
}
