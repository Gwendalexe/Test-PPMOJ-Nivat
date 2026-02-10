// region.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRegions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/problems/regions`);
  }

  getDepartmentsByRegion(regionCode: string): Observable<any> {
    const url = `${this.baseUrl}/problems/regions/${regionCode}/departments`;
    return this.http.get(url);
  }
}
