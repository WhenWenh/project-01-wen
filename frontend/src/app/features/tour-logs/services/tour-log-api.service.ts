import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  CreateTourLogRequest,
  TourLogListResponse,
  TourLogResponse,
  UpdateTourLogRequest
} from '../models/tour-log.models';

@Injectable({ providedIn: 'root' })
export class TourLogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/tour-logs`;

  list(): Observable<TourLogListResponse[]> {
    return this.http.get<TourLogListResponse[]>(this.apiUrl);
  }

  listByTourId(tourId: string): Observable<TourLogResponse[]> {
    return this.http.get<TourLogResponse[]>(`${this.apiUrl}/tour/${tourId}`);
  }

  getById(id: string): Observable<TourLogResponse> {
    return this.http.get<TourLogResponse>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateTourLogRequest): Observable<TourLogResponse> {
    return this.http.post<TourLogResponse>(this.apiUrl, payload);
  }

  update(id: string, payload: UpdateTourLogRequest): Observable<TourLogResponse> {
    return this.http.put<TourLogResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
