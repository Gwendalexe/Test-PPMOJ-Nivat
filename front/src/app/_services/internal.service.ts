import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../_models/User';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InternalService {
  private baseUrl = environment.apiUrl;

  user!: User;
  private userSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    this.loadUserFromLocalStorage();
  }

  setUser(user: User) {
    this.userSubject.next(user);
  }

  getUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  getUserById(userId: string): Observable<any> {
    const url = `${this.baseUrl}/users/${userId}`;
    return this.http.get(url);
  }

  // get_mojette_grid(user: User): Observable<any> {
  //   const url = `${this.baseUrl}/mojette`;
  //   return this.http.get(url);
  // }

  loadUserFromLocalStorage(): User | null {
    const userString = localStorage.getItem('currentUser');
    if (!userString) return this.user;
    try {
      const user: User = JSON.parse(userString);
      this.setUser(user);
      return user;
    } catch {
      localStorage.removeItem('currentUser');
      return null;
    }
  }
}
