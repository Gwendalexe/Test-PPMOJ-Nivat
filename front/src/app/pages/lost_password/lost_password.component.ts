import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-lost_password',
  templateUrl: './lost_password.component.html',
  styleUrls: ['./lost_password.component.scss'],
  host: { class: 'dark-theme' },
  imports: [
    MatCardTitle,
    NgIf,
    MatCardContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
  ],
})
export class LostPasswordComponent {
  hasRetrievedPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  form: FormGroup = new FormGroup({
    email: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    ]),
  });

  getField = (field: string): FormControl =>
    this.form.get(field) as FormControl;

  updateErrorMessage(field: string) {}

  isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  lostpassword() {
    if (this.form.invalid || this.hasRetrievedPassword) {
      this.form.markAllAsTouched();
      return;
    }
    this.authService
      .askPasswordReset(this.getField('email').value)
      .subscribe(response => {
        this.hasRetrievedPassword = response;
    });
  }

  goToPage = (page: string): Promise<boolean> =>
    this.router.navigate([`/${page}`]);
}
