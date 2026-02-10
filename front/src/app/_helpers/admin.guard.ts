import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../_services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Promise<boolean> {
    if (this.authService.isAdmin()) {
      return Promise.resolve(true);
    }
    this.router.navigate(['/']);
    return Promise.resolve(false);
  }
}
