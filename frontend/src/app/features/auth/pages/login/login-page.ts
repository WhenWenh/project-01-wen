import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { finalize } from 'rxjs';

import { AuthApiService } from '../../services/auth-api.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    DividerModule,
    FloatLabelModule,
    InputTextModule,
    PasswordModule
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css'
})
export class LoginPage {
  protected readonly loginForm;
  protected readonly loginError = signal('');
  protected readonly isSubmitting = signal(false);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  constructor(private readonly formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.nonNullable.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  protected onSubmit(): void {
    this.loginForm.markAllAsTouched();
    this.loginError.set('');

    if (this.loginForm.invalid) {
      this.loginError.set('Please fill out all fields correctly.');
      return;
    }
    this.isSubmitting.set(true);

    this.authApi
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
      }))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.loginError.set('Login failed. Please check your username and password.');
        }
      });
  }

  protected showRequiredError(controlName: 'username' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];

    return control.touched && control.hasError('required');
  }
}
