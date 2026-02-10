import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  Formation,
  FormationCategory,
  FormationExtended,
  FormationSession,
} from '../_models/Formation';
import { InternalService } from './internal.service';

@Injectable({
  providedIn: 'root',
})
export class FormationService {
  private baseUrl = environment.apiUrl;
  userId: string | undefined;

  constructor(
    private http: HttpClient,
    private internalService: InternalService
  ) {}

  getFormations(): Observable<Formation[]> {
    const url = `${this.baseUrl}/formations`;
    return this.http.get(url) as Observable<Formation[]>;
  }

  getCalendar(): Observable<FormationExtended[]> {
    const url = `${this.baseUrl}/formations/calendar`;
    return this.http.get(url).pipe(
      map((data: any) => {
        console.log(data);

        return data.map((item: FormationExtended) => {
          return {
            ...item,
            sessions: item.sessions.map((session: FormationSession) =>
              getHumanReadableFormation(session)
            ),
          };
        });
      })
    ) as Observable<FormationExtended[]>;
  }

  getFormationById(formationId: number): Observable<FormationExtended> {
    const url = `${this.baseUrl}/formations/${formationId}`;
    return this.http.get(url).pipe(
      map((data: any) => {
        return {
          ...data,
          sessions: data.sessions.map((session: any) =>
            getHumanReadableFormation(session)
          ),
        };
      })
    ) as Observable<FormationExtended>;
  }

  getFormationByCode(code: string): Observable<Formation[]> {
    const url = `${this.baseUrl}/formations/code/${code}`;
    return this.http.get(url) as Observable<Formation[]>;
  }

  getNextSession(formationId: number): Observable<FormationSession> {
    const url = `${this.baseUrl}/formations/${formationId}/next`;
    return this.http.get(url).pipe(
      map((data: any) => {
        return getHumanReadableFormation(data);
      })
    ) as Observable<FormationSession>;
  }

  getFormationAndNextSessionByCode(
    code: string
  ): Observable<FormationExtended[]> {
    return this.getFormationByCode(code).pipe(
      switchMap((formations: Formation[]) => {
        const formationExtendedObservables = formations.map(
          (formation: Formation) =>
            this.getNextSession(formation.id).pipe(
              map((session: FormationSession) => ({
                ...formation,
                sessions: [session],
                owned: false, // Set the owned property as needed
              }))
            )
        );
        return forkJoin(formationExtendedObservables);
      })
    );
  }

  getFormationCategories(): Observable<FormationCategory[]> {
    const url = `${this.baseUrl}/formations/category`;
    return this.http.get(url) as Observable<FormationCategory[]>;
  }

  getCategoryByCode(code: string): Observable<FormationCategory> {
    const url = `${this.baseUrl}/formations/category/${code}`;
    return this.http.get(url) as Observable<FormationCategory>;
  }

  buyFormation(formationId: number): Observable<any> {
    const url = `${this.baseUrl}/formations/${formationId}/buy`;
    return this.http.post(url, {}) as Observable<any>;
  }

  addUserToFormation(formationId: number, userId: number): Observable<any> {
    // for admin only, the user does not pay (will not work if the user asking isn't an admin)
    const url = `${this.baseUrl}/formations/${formationId}/buy/${userId}`;
    return this.http.post(url, {}) as Observable<any>;
  }

  removeUserFromFormation(
    formationId: number,
    userId: number
  ): Observable<any> {
    const url = `${this.baseUrl}/formations/${formationId}/users/${userId}`;
    return this.http.delete(url) as Observable<any>;
  }

  listFormationUsers(formationId: number): Observable<any> {
    const url = `${this.baseUrl}/formations/${formationId}/users`;
    return this.http.get(url) as Observable<any>;
  }

  updateFormationCategory(category: FormationCategory): Observable<any> {
    const url = `${this.baseUrl}/formations/category/${category.code}`;
    return this.http.put(url, category) as Observable<any>;
  }

  updateFormation(formation: Formation): Observable<any> {
    const url = `${this.baseUrl}/formations/${formation.id}`;
    return this.http.put(url, formation) as Observable<any>;
  }

  addFormation(formation: Formation): Observable<Formation> {
    const url = `${this.baseUrl}/formations`;
    return this.http.post(url, formation) as Observable<Formation>;
  }

  deleteFormation(formationId: number): Observable<any> {
    const url = `${this.baseUrl}/formations/${formationId}`;
    return this.http.delete(url) as Observable<any>;
  }

  updateFormationSession(
    formationId: number,
    formation_availability_id: number,
    session: FormationSession
  ): Observable<any> {
    const url = `${this.baseUrl}/formations/${formationId}/sessions/${formation_availability_id}`;
    return this.http.put(url, session) as Observable<any>;
  }

  addFormationSession(
    formationId: number,
    session: FormationSession
  ): Observable<FormationSession> {
    const url = `${this.baseUrl}/formations/${formationId}/sessions`;
    return this.http.post(url, session) as Observable<FormationSession>;
  }

  deleteFormationSession(
    formationId: number,
    formation_availability_id: number
  ): Observable<any> {
    const url = `${this.baseUrl}/formations/${formationId}/sessions/${formation_availability_id}`;
    return this.http.delete(url) as Observable<any>;
  }

  uploadFormationImage(file: File) {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<{ image_url: string }>(
      `${environment.apiUrl}/formations/upload-image`,
      fd
    );
  }
}

function getHumanReadableFormation(formation: any): FormationSession {
  let calculated_horaire = 'à venir...';
  let calculated_jour = 'à venir...';

  if (formation.delivery_date != null) {
    formation.delivery_date = formation.delivery_date + 'Z';
    const start = new Date(formation.delivery_date);
    const end = new Date(formation.delivery_date);
    end.setMinutes(end.getMinutes() + formation.duration_minutes);
    calculated_jour = start.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    calculated_horaire =
      start.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' - ' +
      end.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
  }
  return {
    ...formation,
    delivery_date: new Date(formation.delivery_date),
    calculated_jour: calculated_jour,
    calculated_horaire: calculated_horaire,
  } as FormationSession;
}
