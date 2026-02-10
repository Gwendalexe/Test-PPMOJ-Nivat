import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../_models/User';
import { InternalService } from './internal.service';

@Injectable({
  providedIn: 'root',
})
export class NivatService {
  private readonly baseUrl = environment.apiUrl;
  userId: number | undefined;

  constructor(
    private readonly http: HttpClient,
    private readonly internalService: InternalService
  ) {
    this.internalService.getUser().subscribe((user: User | null) => {
      if (user?.id) {
        this.userId = user.id;
      }
    });
  }

  getCurrentNivatGrid(): Observable<any> {
    const url = `${this.baseUrl}/nivats/current`;
    return this.http.get(url);
  }

  getNivatsGridByLevel(level: number): Observable<any> {
    const url = `${this.baseUrl}/nivats?level=${level}`;
    return this.http.get(url);
  }

  getNthLastNivatGridByLevel(offset: number, level: string): Observable<any> {
    const url = `${this.baseUrl}/nivats/${offset}/level/${level}`;
    return this.http.get(url);
  }

  getNivatHint(grid_id: string): Observable<any> {
    const url = `${this.baseUrl}/nivats/${grid_id}/hint`;
    return this.http.get(url);
  }

  verifySolution(id: string, solution: number[]): Observable<boolean> {
    const url = `${this.baseUrl}/verify-nivat-solution`;
    const requestData = { id, solution };
    return this.http.post<boolean>(url, requestData);
  }

  hasUserSolvedGrid(grid_id: string): Observable<any> {
    const url = `${this.baseUrl}/nivats/${grid_id}/completed`;
    return this.http.get(url);
  }

  getNivatsCompletedByUser() {
    const url = `${this.baseUrl}/nivats/completed`;
    return this.http.get(url);
  }

  postSolvedNivat(nivat_id: string, completionTime: number, moveCount: number, level = 2): Observable<any> {
    const url = `${this.baseUrl}/nivats/${nivat_id}/verify`;
    const requestData = {
      completion_time: completionTime, // Snake_case pour matcher le python
      helps_used: 0,
      grid: [],
      level: level, // On envoie le niveau pour le calcul des points
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
