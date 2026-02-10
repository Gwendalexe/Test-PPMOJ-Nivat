import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { InternalService } from './internal.service';
import { User } from '../_models/User';
import { environment } from 'src/environments/environment';

interface VerificationResponse {
  reward: number;
  mojette: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProblemService {
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

  // getDepartment(departmentId: number): Observable<any> {
  //   const url = `${this.baseUrl}/region/${departmentId}`;
  //   return this.http.get(url);
  // }
  getProblems(): Observable<any> {
    const url = `${this.baseUrl}/problems`;
    return this.http.get(url);
  }

  getProblemById(problemId: number): Observable<any> {
    const url = `${this.baseUrl}/problems/${problemId}`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  getProblemsCompletedByUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/problems/completed`);
  }

  get_level(userId: string | undefined, departmentId: string): Observable<any> {
    const apiUrl = `${this.baseUrl}/users/${userId}/levels/${departmentId}`;
    return this.http.get(apiUrl);
  }

  verifySolution(
    problem_id: number,
    indiceAVerifier: number[],
    valuesToVerify: number[] | number[][],
    helps_used: number
  ): Observable<HttpResponse<VerificationResponse>> {
    const url = `${this.baseUrl}/problems/${problem_id}/verify`;
    const requestData = {
      values: valuesToVerify,
      indice: indiceAVerifier,
      helps_used,
    };
    return this.http.post<VerificationResponse>(url, requestData, {
      observe: 'response',
    });
  }

  getProblemHint(problem_id: number, hint_nb: number): Observable<any> {
    const url = `${this.baseUrl}/problems/${problem_id}/hint/${hint_nb}`;
    return this.http.get(url);
  }

  hasUserSolvedProblem(problem_id: number): Observable<any> {
    const url = `${this.baseUrl}/problems/${problem_id}/completed`;
    return this.http.get(url);
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
