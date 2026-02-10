import { Output, EventEmitter } from '@angular/core';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';
import { InternalService } from 'src/app/_services/internal.service';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_models/User';
import { NgIf } from '@angular/common';
import { MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    imports: [NgIf, MatCardTitle, MatCardContent, MatIcon, FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatError]
})
export class RegisterComponent {
  // @Output() onOpenDialog: EventEmitter<any> = new EventEmitter();
  // @Output() onLogout: EventEmitter<any> = new EventEmitter();

  dialogCallback(): void {
    // this.onOpenDialog.emit();
  }

  //  @ViewChild('navbarContainer') navbarContainer!: ElementRef;

  isRegisterMode = false;
  isConnected = false;
  isConfirmed = false;
  hasRegistered = false;
  loading = false;
  hideLoginPassword = true;
  hideRegisterPassword = true;

  private userInfoSubscription: Subscription; //important to create a subscription

  constructor(
    private authService: AuthService,
    private internalService: InternalService
  ) {
    this.userInfoSubscription = this.authService
      .getUpdateInfo()
      .subscribe(value => {
        if (value == null) {
          this.hasRegistered = false;
          this.isConnected = false;
          this.isConfirmed = false;
        }
      });
  }
  
  loginForm: FormGroup = new FormGroup({
    identifier: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    password: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(4),
    ]),
  });

  registerForm: FormGroup = new FormGroup({
    username: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]),
    email: new FormControl<string>('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl<string>('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  serverError: { [key: string]: boolean } = {};

  closeDialog() {
    this.resetForms();
    this.serverError = {};
    this.hasRegistered = false;
    this.isRegisterMode = false;
    const connectDialog: HTMLDivElement | null = document.getElementById(
      'connectDialog'
    ) as HTMLDivElement | null;
    if (connectDialog instanceof HTMLDialogElement) connectDialog.close();
  }

  clickDialog(event: Event) {
    if (!(event.target instanceof Element)) return;
    if (
      event.target.id == 'connectDialog' &&
      (!this.isConnected || this.isConfirmed)
    )
      this.closeDialog();
  }

  getLoginField = (field: string): FormControl => this.loginForm.get(field) as FormControl;
  getRegisterField = (field: string): FormControl => this.registerForm.get(field) as FormControl;

  resetForms = () => {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.getLoginField(key);
      if (control) control.setErrors(null);
    });
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.getRegisterField(key);
      if (control) control.setErrors(null);
    });
  };

  toggleRegisterMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.serverError = {};
  }

  login() {
    if (this.loading) return;
    if (this.loginForm.invalid) return;

    this.loading = true;

    const user: User = {
      username: this.loginForm.value.identifier,
      password: this.loginForm.value.password,
    };

    this.authService.login(user).subscribe({
      next: data => {
        this.internalService.setUser(data);
        this.authService.sendUpdateUserInfo(data);
        this.hasRegistered = false;
        this.isConnected = true;
        this.isConfirmed = data.confirmed || false;
        this.closeDialog();
      },
      error: err => {
        this.serverError[err.status] = true;
        this.loading = false
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  register() {
    if (this.loading) return;
    if (this.registerForm.invalid) return;

    this.loading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.hasRegistered = true;
      },
      error: err => {
        this.serverError[err.status] = true;
        if (err.status == 409) {
          const errorField = err.error.message.split(' ')[0];
          this.getRegisterField(errorField).setErrors({ alreadyUsed: true });
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
