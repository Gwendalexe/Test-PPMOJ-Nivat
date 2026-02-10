import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { User } from '../_models/User';
import { environment } from 'src/environments/environment';
import { stringToKeyValue } from '@angular/flex-layout/extended/style/style-transforms';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiUrl;

  Admin!: User;

  private AdminSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {}

  CreatePb(
    idregion: string,
    typeValue: string,
    niveauValue: number,
    enonceValue: string,
    recompenseValue: string,
    nbQuestion: number,
    nbValToFind: number,
    nbItem: number,
    ValeurAide1Value: number,
    enonce_AideValue: string,
    questionValue: string[],
    liste_valValue: Array<{ name: string; values: Array<number> }>,
    solution: Array<number>
  ): Observable<boolean> {
    const url = `${this.baseUrl}/createPb`;
    let imagepath: string;

    if (typeValue.length >= 2 && typeValue.slice(-1) === '0') {
      imagepath = 'm' + typeValue.slice(0, 2) + '.svg';
    } else if (typeValue.length >= 2 && typeValue.slice(-1) === '1') {
      imagepath = 'i' + typeValue.slice(0, 2) + '.svg';
    } else {
      imagepath = idregion + '.svg';
    }
    const Typeint = parseInt(typeValue);
    const requestData = {
      idregion,
      Typeint,
      niveauValue,
      recompenseValue,
      enonceValue,
      nbQuestion,
      nbItem,
      nbValToFind,
      ValeurAide1Value,
      enonce_AideValue,
      imagepath,
      questionValue,
      liste_valValue,
      solution,
    };
    return this.http.post<boolean>(url, requestData);
  }

  uploadFile(idEnigme: number, svgfile: string) {
    const requestData = {
      idEnigme,
      svgfile,
    };
    return this.http.post<boolean>(`${this.baseUrl}/upload`, requestData);
  }

  getEnigmeById(id: number, regionId: string): Observable<any> {
    const url = `${this.baseUrl}/enigmes/${id}?region=${regionId}`;
    return this.http.get(url);
  }

  updateEnigme(enigme: any): Observable<any> {
    // Assurez-vous que l'URL et le corps de la requête sont corrects pour votre API
    // Remplacez '/api/enigmes/update' par l'URL réelle pour mettre à jour une énigme
    return this.http.put(`${this.baseUrl}/enigme/update/${enigme.id}`, enigme);
  }
}
