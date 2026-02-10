import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EnigmeSemaine } from '../_models/Enigme_semaine';
import { User } from '../_models/User';
import { InternalService } from './internal.service';

@Injectable({
  providedIn: 'root',
})
export class WeekProblemService {
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

    // Va chercher tous les problemes de la semaine
    getWeekProblems(): Observable<EnigmeSemaine[]> {
        const url = `${this.baseUrl}/week_problems`;
        return this.http.get<EnigmeSemaine[]>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Va chercher un probleme de la semaine par id
    getWeekProblemById(id: string): Observable<EnigmeSemaine> {
        const url = `${this.baseUrl}/week_problems/${id}`;
        return this.http.get<EnigmeSemaine>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Va chercher le probleme de cette semaine, ou le plus recent si il n'y en a pas en db pour cette semaine
    getCurrentWeekProblem(): Observable<EnigmeSemaine> {
        const url = `${this.baseUrl}/week_problems/current`;
        return this.http.get<EnigmeSemaine>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Crée un nouveau probleme de la semaine
    createWeekProblem(weekProblem: Partial<EnigmeSemaine>): Observable<EnigmeSemaine> {
        const url = `${this.baseUrl}/week_problems`;
        return this.http.post<EnigmeSemaine>(url, weekProblem).pipe(
            catchError(this.handleError)
        );
    }

    // Met à jour un probleme de la semaine
    updateWeekProblem(id: number, weekProblem: Partial<EnigmeSemaine>): Observable<EnigmeSemaine> {
        const url = `${this.baseUrl}/week_problems/${id}`;
        return this.http.put<EnigmeSemaine>(url, weekProblem).pipe(
            catchError(this.handleError)
        );
    }

    // Supprime un probleme de la semaine
    deleteWeekProblem(id: number): Observable<any> {
        const url = `${this.baseUrl}/week_problems/${id}`;
        return this.http.delete(url).pipe(
            catchError(this.handleError)
        );
    }

  // Vérifie une énigme de la semaine et déclenche les récompenses côté serveur
  verifyWeekProblem(id: number, values: number[], indice: number[], helps_used = 0): Observable<{ reward: number; mojettes: number; }> {
      const url = `${this.baseUrl}/week_problems/${id}/verify`;
      return this.http.post<{ reward: number; mojettes: number; }>(url, { values, indice, helps_used }).pipe(
          catchError(this.handleError)
      );
  }

    // Upload an image for the week problem
    uploadWeekProblemImage(file: File) {
        const url = `${this.baseUrl}/week_problems/upload-image`;
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post<{ image_url: string }>(url, formData).pipe(
            catchError(this.handleError)
        );
    }

    // Vérifie si l'utilisateur a complété une énigme de la semaine
    hasCompletedWeekProblem(id: number) {
        const url = `${this.baseUrl}/week_problems/${id}/completed`;
        return this.http.get<{ completed: boolean; user_id: number; problem_id: number; completion_date: string | null; helps_used: number; reward_mojette: number; reward_token_coin: number; }>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Récupère toutes les énigmes de semaine complétées par l'utilisateur
    getCompletedWeekProblems() {
        const url = `${this.baseUrl}/week_problems/completed`;
        return this.http.get<{ completed_ids: number[] }>(url).pipe(
            catchError(this.handleError)
        );
    }

    // Récupère les complétions pour une énigme de la semaine (Wall Of Fame)
    getWeekProblemCompletions(id: number) {
        const url = `${this.baseUrl}/week_problems/${id}/completions`;
        return this.http.get<Array<{ user_id: number; username?: string; completion_date: string; helps_used?: number }>>(url).pipe(
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
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
