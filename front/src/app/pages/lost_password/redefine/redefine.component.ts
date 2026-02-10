import { Component } from '@angular/core';

import { NgIf } from '@angular/common';
import { OnInit } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { MatIcon } from '@angular/material/icon';
@Component({
  selector: 'app-redefine',
  imports: [
    MatCardTitle,
    NgIf,
    MatCardContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatIcon,
    MatError,
  ],
  templateUrl: './redefine.component.html',
  styleUrl: './redefine.component.scss',
  host: { class: 'dark-theme' },
})
export class RedefineComponent implements OnInit {
  token: string | null = null;
  hidePassword: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  form: FormGroup = new FormGroup({
    password: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    passwordConfirm: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.token = params['token'];
    });
  }

  getField = (field: string): FormControl =>
    this.form.get(field) as FormControl;

  updatePassword() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.form.value.password !== this.form.value.passwordConfirm) {
      this.form.get('passwordConfirm')?.setErrors({ notSame: true });
      return;
    }
    if (!this.token) return;
    this.authService
      .resetPassword(this.token, this.form.value.password)
      .subscribe(value => {
        if (value) {
          this.router.navigate(['/login']);
        }
      });
  }

  goToPage = (page: string): Promise<boolean> =>
    this.router.navigate([`/${page}`]);
}
