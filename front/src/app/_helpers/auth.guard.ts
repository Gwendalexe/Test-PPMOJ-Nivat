import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../_services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Promise<boolean> {
    // console.log("canActivate")
    const id = JSON.parse(localStorage.getItem('currentUser')!)['id'];
    return this.authService
      .isConfirmed(id)
      .toPromise()
      .then((isConfirmed: boolean) => {
        if (!isConfirmed) this.router.navigate(['/']);
        return isConfirmed;
      })
      .catch((error: any) => {
        console.error('Error checking user confirmation status: ' + error);
        this.router.navigate(['/']);
        return false;
      });
  }
}
