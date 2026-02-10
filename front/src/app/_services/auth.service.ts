import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../_models/User';
import { ConfirmationDialogComponent } from '../pages/account/confirmation-dialog.component';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    private router: Router
  ) {}

  url = environment.apiUrl;

  private loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private userMojetteSubject = new Subject<number>(); //need to create a subject
  private userTokenCoinSubject = new Subject<number>(); //need to create a subject
  private userInfoSubject = new Subject<any>(); //need to create a subject
  private userConfirmationSubject = new Subject<boolean>(); //need to create a subject

  sendUpdateMojette(mojetteValue: number) {
    //the component that wants to update something, calls this fn
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    currentUser.mojettes = (currentUser.mojettes || 0) + (mojetteValue || 0);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    // Broadcast the ABSOLUTE updated mojettes count (to match navbar expectations)
    this.userMojetteSubject.next(currentUser.mojettes);
  }

  getUpdateMojette(): Observable<any> {
    //the receiver component calls this function
    return this.userMojetteSubject.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

  sendUpdateTokenCoin(tokenCoin: number) {
    //the component that wants to update something, calls this fn
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    currentUser.token_coin = tokenCoin;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    this.userTokenCoinSubject.next(tokenCoin); //next() will feed the value in Subject
  }

  getUpdateTokenCoin(): Observable<any> {
    //the receiver component calls this function
    return this.userTokenCoinSubject.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

  sendUpdateUserInfo(userInfo: any) {
    //the component that wants to update something, calls this fn
    if (userInfo != null) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
      currentUser.username = userInfo.username;
      currentUser.email = userInfo.email;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }

    this.userInfoSubject.next(userInfo); //next() will feed the value in Subject
  }

  getUpdateInfo(): Observable<any> {
    //the receiver component calls this function
    return this.userInfoSubject.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

  sendUpdateUserConfirmation(confirmation: boolean) {
    //the component that wants to update something, calls this fn
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    currentUser.confirmed = confirmation;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    this.userInfoSubject.next(confirmation); //next() will feed the value in Subject
  }

  getUpdateConfirmation(): Observable<boolean> {
    //the receiver component calls this function
    return this.userConfirmationSubject.asObservable(); //it returns as an observable to which the receiver funtion will subscribe
  }

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getAuthorizationToken(): string {
    const userJSON = localStorage.getItem('currentUser');
    let token = '';
    if (userJSON) {
      const user = JSON.parse(userJSON);
      if (user && user.token) {
        token = user.token;
      }
    }
    return token;
  }

  register(credentials: User): Observable<any> {
    return this.http.post(this.url + '/register', credentials).pipe(
      tap(response => {
        this.loggedIn.next(true);
      })
    );
  }

  openConfirmationDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    return dialogRef.afterClosed();
  }

  logout() {
    localStorage.clear();
    this.sendUpdateUserInfo(null);
    this.router.navigate(['/']);
  }

  login(credentials: User): Observable<User> {
    return this.http.post<User>(this.url + '/login', credentials).pipe(
      tap(user => {
        this.saveUserToLocalStorage(user); // Sauvegarder l'utilisateur dans le stockage local
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.url + '/users');
  }

  getUserById(user_id: number): Observable<any> {
    return this.http.get<User>(this.url + `/users/${user_id}`);
  }

  isConfirmed(id: number): Observable<any> {
    const url = `${this.url}/users/${id}/confirmed`;
    return this.http.get(url).pipe(map((user: any): boolean => user.confirmed));
  }

  isAdmin(): boolean {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    return currentUser.role === 'Admin' ? true : false;
  }

  updateUserById(
    id: number,
    newUserData: { [key: string]: string }
  ): Observable<any> {
    if (newUserData === null) return of(false);
    const url = `${this.url}/users/${id}`;

    return this.http.put<boolean>(url, newUserData);
  }

  confirmAccount(user_id: number, token: string): Observable<any> {
    const url = `${this.url}/users/${user_id}/confirm/${token}`;
    return this.http.put<boolean>(url, {});
  }

  exportUserData(user_id: number): Observable<Blob> {
    const url = `${this.url}/user/${user_id}/export-data`;
    return this.http.get(url, { responseType: 'blob' });
  }

  deleteUserAccount(user_id: number): Observable<any> {
    const url = `${this.url}/user/${user_id}/delete-account`;
    return this.http.delete(url);
  }

  private saveUserToLocalStorage(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  reloadUser(reloadPage = true): void {
    const old_user = JSON.parse(localStorage.getItem('currentUser')!);
    const user_id = old_user.id;
    const token = old_user.token;
    this.getUserById(user_id).subscribe(user => {
      user.token = token;
      this.saveUserToLocalStorage(user);
      // Broadcast absolute balances so UI updates without manual refresh
      try {
        this.userMojetteSubject.next(user.mojettes);
        this.userTokenCoinSubject.next(user.token_coin);
      } catch {}
      if (reloadPage) window.location.reload();
    });
  }

  willdeleteUser(): Observable<boolean> {
    const userString: string | null = localStorage.getItem('currentUser');
    if (userString !== null) {
      const userObject = JSON.parse(userString);
      const userId = userObject.id;
      const url = `${this.url}/usersdel/${userId}`;

      return this.http.get<boolean>(url).pipe(
        catchError((error: any) => {
          console.error('Erreur lors de la requête:');
          return of(false);
        })
      );
    } else {
      return of(false);
    }
  }

  askPasswordReset(email: string): Observable<boolean> {
    const url = `${this.url}/reset_password_request`;
    const body = {
      email: email,
    };

    return this.http.post<boolean>(url, body).pipe(
      catchError((error: any) => {
        console.error('Erreur lors de la requête:');
        return of(false);
      })
    );
  }

  resetPassword(token: string, password: string): Observable<any> {
    const url = `${this.url}/reset_password/${token}`;
    const body = {
      password: password,
    };

    return this.http.post(url, body).pipe(
      catchError((error: any) => {
        console.error('Erreur lors de la requête:');
        return of(false);
      })
    );
  }

  //LEGACY
  // deleteUser(): Observable<any> {
  //   return new Observable(observer => {
  //     this.router.navigate(['/']);
  //     const userString: string | null = localStorage.getItem('currentUser');

  //     if (userString !== null) {
  //       const userObject = JSON.parse(userString);
  //       const userId = userObject.id;
  //       localStorage.removeItem('UserId');
  //       const urldelete = `${this.url}/usersdel/${userId}`;

  //       this.http.delete(urldelete).pipe(
  //         tap(() => {
  //           this.router.navigate(['/']);
  //           observer.next();
  //           observer.complete();
  //         })
  //       ).subscribe();
  //     } else {
  //       console.error("La clé 'currentUser' n'existe pas dans le localStorage ou sa valeur est null.");
  //       localStorage.removeItem('UserId');
  //       observer.next(null);
  //       observer.complete();
  //     }
  //   });
  // }
  // modifiedEmail(modifiedEmail: string): Observable<boolean> {
  //   const userString: string | null = localStorage.getItem('currentUser');
  //   if (userString !== null) {
  //     const userObject = JSON.parse(userString);
  //     const userId = userObject.id;
  //     const url = `${this.url}/usersModifEmail/${userId}`;
  //     const requestData = {
  //       modifiedEmail
  //     };
  //     return this.http.post<boolean>(url, requestData)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   } else {
  //     return of(false);
  //   }
  // }

  // isAdmin(user_id: number): Observable<any> {
  //   const url = `${this.url}/role/${user_id}`;
  //   return this.http.get(url).pipe(
  //     map((user_data: any) => {
  //       const role = user_data.role;
  //       if (role == "Admin") {
  //         return true;
  //       } else {
  //         return false
  //       }
  //     })
  //   );
  // }

  // changePassword(newPassword: string): Observable<boolean> {
  //   const userString: string | null = localStorage.getItem('currentUser');
  //   if (userString !== null) {
  //     const userObject = JSON.parse(userString);
  //     const userEmail = userObject.email;
  //     const url = `${this.url}/usersModifPW/${userEmail}`;
  //     const requestData = {
  //       newPassword
  //     };

  //     return this.http.post<boolean>(url, requestData)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   } else {

  //     return of(false);
  //   }
  // }

  // changeUsername(newUsername: string): Observable<boolean> {
  //   const userString: string | null = localStorage.getItem('currentUser');
  //   if (userString !== null) {
  //     const userObject = JSON.parse(userString);
  //     const userEmail = userObject.email;
  //     const url = `${this.url}/usersModifUN/${userEmail}`;
  //     const requestData = {
  //       newUsername
  //     };

  //     return this.http.post<boolean>(url, requestData)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   } else {

  //     return of(false);
  //   }
  // }

  // willmodifiedEmail(): Observable<boolean> {
  //   const userString: string | null = localStorage.getItem('currentUser');
  //   if (userString !== null) {
  //     const userObject = JSON.parse(userString);
  //     const userId = userObject.id;
  //     const url = `${this.url}/usersModifEmail/${userId}`;

  //     return this.http.get<boolean>(url)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   } else {

  //     return of(false);
  //   }
  // }

  // willmodifiedPW(email?: string): Observable<boolean> {
  //   const userString: string | null = localStorage.getItem('currentUser');
  //   if (email) {
  //     const url = `${this.url}/usersModifPW/${email}`;
  //     return this.http.get<boolean>(url)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   }
  //   else if (userString !== null) {
  //     const userObject = JSON.parse(userString);
  //     const userEmail = userObject.email;
  //     const url = `${this.url}/usersModifPW/${userEmail}`;

  //     return this.http.get<boolean>(url)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   } else {

  //     return of(false);
  //   }
  // }

  // willmodifiedUN(): Observable<boolean> {
  //   const userString: string | null = localStorage.getItem('currentUser');
  //   if (userString !== null) {
  //     const userObject = JSON.parse(userString);
  //     const userEmail = userObject.email;
  //     const url = `${this.url}/usersModifUN/${userEmail}`;

  //     return this.http.get<boolean>(url)
  //       .pipe(
  //         catchError((error: any) => {
  //           console.error('Erreur lors de la requête:');
  //           return of(false);
  //         })
  //       );
  //   } else {

  //     return of(false);
  //   }
  // }
}
