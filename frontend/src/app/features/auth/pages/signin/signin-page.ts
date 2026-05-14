import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../services/auth-api.service';

const matchingPasswordsValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword || password === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
};

@Component({
  selector: 'app-signin-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    DividerModule,
    FloatLabelModule,
    InputTextModule,
    PasswordModule
  ],
  templateUrl: './signin-page.html',
  styleUrl: './signin-page.css'
})
export class SigninPage {
  protected readonly signinForm;
  protected readonly submitError = signal('');
  protected readonly isSubmitting = signal(false);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  constructor(private readonly formBuilder: FormBuilder) {
    this.signinForm = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      confirmPassword: ['', [Validators.required]],
      rememberMe: [false]
    }, {
      validators: [matchingPasswordsValidator]
    });
  }

  protected onSubmit(): void {
    this.signinForm.markAllAsTouched();
    this.submitError.set('');

    if (this.signinForm.invalid) {
      if (this.signinForm.hasError('passwordMismatch')) {
        this.submitError.set('Passwords do not match. Please try again.');
      }
      return;
    }

    const { email, username, password } = this.signinForm.getRawValue();

    this.isSubmitting.set(true);

    this.authApi
      .register({ email, username, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.submitError.set('Sign In failed. Please try again.');
        }
      });
  }

  protected showRequiredError(controlName: 'email' | 'username' | 'password' | 'confirmPassword'): boolean {
    const control = this.signinForm.controls[controlName];

    return control.touched && control.hasError('required');
  }

  protected showEmailError(): boolean {
    const control = this.signinForm.controls.email;

    return control.touched && control.hasError('email');
  }

  protected showMinLengthError(controlName: 'username' | 'password'): boolean {
    const control = this.signinForm.controls[controlName];

    return control.touched && control.hasError('minlength');
  }

  protected showPasswordMismatchError(): boolean {
    const confirmPassword = this.signinForm.controls.confirmPassword;

    return confirmPassword.touched && this.signinForm.hasError('passwordMismatch');
  }
}
