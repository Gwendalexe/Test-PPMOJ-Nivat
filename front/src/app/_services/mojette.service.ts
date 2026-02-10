import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../_models/User';
import { InternalService } from './internal.service';

@Injectable({
  providedIn: 'root',
})
export class MojetteService {
  private baseUrl = environment.apiUrl;
  userId: number | undefined;

  constructor(
    private http: HttpClient,
    private internalService: InternalService
  ) {
    this.internalService.getUser().subscribe((user: User | null) => {
      if (user && user.id) {
        this.userId = user.id;
      }
    });
  }

  getCurrentMojetteGrid(): Observable<any> {
    const url = `${this.baseUrl}/mojettes/current`;
    return this.http.get(url);
  }

  getMojettesGridByLevel(level: number): Observable<any> {
    const url = `${this.baseUrl}/mojettes?level=${level}`;
    return this.http.get(url);
  }
  getNthLastMojetteGridByLevel(offset: number, level: string): Observable<any> {
    const url = `${this.baseUrl}/mojettes/${offset}/level/${level}`;
    return this.http.get(url);
  }

  getMojetteHint(grid_id: number): Observable<any> {
    const url = `${this.baseUrl}/mojettes/${grid_id}/hint`;
    return this.http.get(url);
  }

  verifySolution(id: string, solution: number[]): Observable<boolean> {
    const url = `${this.baseUrl}/verify-mojette-solution`;
    const requestData = { id, solution };
    return this.http.post<boolean>(url, requestData);
  }

  hasUserSolvedGrid(grid_id: number): Observable<any> {
    const url = `${this.baseUrl}/mojettes/${grid_id}/completed`;
    return this.http.get(url);
  }

  getDailyGrid(): Observable<any> {
    const url = `${this.baseUrl}/mojettes/daily`;
    return this.http.get(url);
  }

  getGridById(id: number): Observable<any> {
    const url = `${this.baseUrl}/mojettes/grid/${id}`;
    return this.http.get(url);
  }

  getDailyGridid(day: number): Observable<any> {
    const url = `${this.baseUrl}/mojettes/daily?day=${day}`;
    return this.http.get(url);
  }

  getDailyGridsCompletionStatus(): Observable<Record<string, boolean>> {
    const url = `${this.baseUrl}/mojettes/daily/completed`;
    return this.http.get<Record<string, boolean>>(url);
  }

  getMojettesCompletedByUser() {
    const url = `${this.baseUrl}/mojettes/complete`;
    return this.http.get(url);
  }

  getMojetteLeaderboard(
    mojette_id: number,
    size = 10,
    range = 1
  ): Observable<any> {
    const url = `${this.baseUrl}/mojettes/${mojette_id}/leaderboard?size=${size}&range=${range}`;
    return this.http.get(url);
  }

  postSolvedMojette(
    mojette_id: number,
    grid: Array<number>,
    helps_used: number,
    completion_time: number
  ): Observable<any> {
    const url = `${this.baseUrl}/mojettes/${mojette_id}/verify`;
    const requestData = {
      grid,
      helps_used,
      completion_time,
    };
    return this.http.post(url, requestData);
  }

  private handleError(error: HttpErrorResponse) {
    // You could log the error internally here if needed
    let message = 'Unable to complete the request';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      message = 'An error occurred:' + error.error.message;
    } else {
      // Server-side error
      message = 'Server error occurred. Please try again later.';
    }
    return throwError(() => new Error(message));
  }
}
