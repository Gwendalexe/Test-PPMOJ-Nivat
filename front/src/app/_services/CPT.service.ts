import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SolutionTile } from '../_models/Pbcpts';
import { InternalService } from './internal.service';

@Injectable({
  providedIn: 'root',
})
export class CPTService {
  private baseUrl = environment.apiUrl;
  userId: string | undefined;

  constructor(
    private http: HttpClient,
    private internalService: InternalService
  ) {}

  getCurrentCarre(): Observable<any> {
    const url = `${this.baseUrl}/carres/current`;
    return this.http.get(url);
  }

  getRandomCarre(): Observable<any> {
    const url = `${this.baseUrl}/carres/random`;
    return this.http.get(url);
  }

  postSolvedCarre(
    carre_id: number,
    solution: Array<SolutionTile>,
    completion_time: number
  ): Observable<any> {
    const url = `${this.baseUrl}/carres/${carre_id}/verify`;
    const requestData = {
      solution,
      completion_time,
    };
    return this.http.post(url, requestData);
  }

  getCarresCompletedByUser() {
    const url = `${this.baseUrl}/carres/complete`;
    return this.http.get(url);
  }

  hasUserSolvedCarre(carre_id: number): Observable<any> {
    const url = `${this.baseUrl}/carres/${carre_id}/completed`;
    return this.http.get(url);
  }
}
