import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';

export interface HelloResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class HelloService {
  private readonly apiUrl = `${API_BASE_URL}/hello`;

  constructor(private http: HttpClient) {}

  getHello(): Observable<HelloResponse> {
    return this.http.get<HelloResponse>(this.apiUrl);
  }
}
