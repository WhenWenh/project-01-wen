import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { PendingChangesAware } from '../../../../core/guards/pending-changes.guard';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageBreadcrumbComponent } from '../../../../shared/components/page-breadcrumb/page-breadcrumb';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourLogResponse } from '../../models/tour-log.models';
import { TourLogApiService } from '../../services/tour-log-api.service';

@Component({
  selector: 'app-edit-log-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    AppShellComponent,
    ConfirmDialogComponent,
    PageBreadcrumbComponent
  ],
  templateUrl: './edit-log-page.html',
  styleUrl: './edit-log-page.css'
})
export class EditLogPage implements PendingChangesAware {
  protected readonly minDateTime = '1900-01-01T00:00';
  protected readonly maxDateTime = '9999-12-31T23:59';
  protected readonly maxCommentLength = 500;
  protected readonly editLogForm;
  protected readonly isLoadingLog = signal(true);
  protected readonly loadError = signal('');
  protected readonly loadedLog = signal<TourLogResponse | null>(null);
  protected readonly breadcrumbItems = signal<MenuItem[]>([
    { label: 'Tour Logs', routerLink: '/tour-logs' },
    { label: 'Log Details' },
    { label: 'Edit' }
  ]);
  protected readonly saveError = signal('');
  protected isLoggingOut = false;
  protected isSaving = false;
  protected showLeaveDialog = false;

  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tourLogApi = inject(TourLogApiService);
  private pendingLeaveResolver: ((value: boolean) => void) | null = null;
  private allowRouteChange = false;

  constructor() {
    this.editLogForm = this.formBuilder.nonNullable.group({
      dateTime: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        ]
      ],
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      difficulty: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      totalTime: ['', [Validators.required]],
      totalDistance: ['', [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      comment: ['', [Validators.required, Validators.maxLength(this.maxCommentLength)]]
    });

    const logId = this.route.snapshot.paramMap.get('id');

    if (!logId) {
      this.loadError.set('Log ID is missing.');
      this.isLoadingLog.set(false);
      return;
    }

    this.tourLogApi
      .getById(logId)
      .pipe(finalize(() => this.isLoadingLog.set(false)))
      .subscribe({
        next: (log) => {
          this.loadedLog.set(log);
          this.saveError.set('');
          this.editLogForm.patchValue({
            dateTime: this.toDateTimeLocalValue(log.dateTime),
            rating: String(log.rating),
            difficulty: String(log.difficulty),
            totalTime: String(log.totalTime),
            totalDistance: String(log.totalDistance),
            comment: log.comment
          });
          this.editLogForm.markAsPristine();
          this.breadcrumbItems.set([
            { label: 'Tour Logs', routerLink: '/tour-logs' },
            { label: log.id, routerLink: ['/tour-logs', log.id] },
            { label: 'Edit' }
          ]);
        },
        error: () => {
          this.loadError.set('Log details could not be loaded.');
          this.loadedLog.set(null);
        }
      });
  }

  protected logout(): void {
    this.isLoggingOut = true;

    this.authApi
      .logout()
      .pipe(finalize(() => (this.isLoggingOut = false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.authSession.clearToken();
          void this.router.navigateByUrl('/login');
        }
      });
  }

  protected goBack(): void {
    const logId = this.route.snapshot.paramMap.get('id');

    if (!logId) {
      void this.router.navigateByUrl('/tour-logs');
      return;
    }

    void this.router.navigate(['/tour-logs', logId]);
  }

  protected showDateTimeFormatError(): boolean {
    const control = this.editLogForm.controls.dateTime;
    return control.touched && !control.hasError('required') && control.hasError('pattern');
  }

  protected showRequiredError(
    controlName: 'dateTime' | 'rating' | 'difficulty' | 'totalTime' | 'totalDistance' | 'comment'
  ): boolean {
    const control = this.editLogForm.controls[controlName];
    return control.touched && control.hasError('required');
  }

  protected showRangeError(controlName: 'rating' | 'difficulty'): boolean {
    const control = this.editLogForm.controls[controlName];
    return control.touched && (control.hasError('min') || control.hasError('max'));
  }

  protected showDistanceError(): boolean {
    const control = this.editLogForm.controls.totalDistance;
    return control.touched && (control.hasError('min') || control.hasError('pattern'));
  }

  protected get commentLength(): number {
    return this.editLogForm.controls.comment.value.length;
  }

  protected get isCommentTooLong(): boolean {
    const control = this.editLogForm.controls.comment;
    return control.touched && control.hasError('maxlength');
  }

  protected saveLog(): void {
    const loadedLog = this.loadedLog();

    this.editLogForm.markAllAsTouched();
    this.saveError.set('');

    if (!loadedLog || this.editLogForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;

    this.tourLogApi
      .update(loadedLog.id, {
        dateTime: new Date(this.editLogForm.controls.dateTime.value).toISOString(),
        rating: Number(this.editLogForm.controls.rating.value),
        difficulty: Number(this.editLogForm.controls.difficulty.value),
        totalTime: Number(this.editLogForm.controls.totalTime.value),
        totalDistance: Number(this.editLogForm.controls.totalDistance.value),
        comment: this.editLogForm.controls.comment.value.trim()
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (log) => {
          this.loadedLog.set(log);
          this.editLogForm.patchValue({
            dateTime: this.toDateTimeLocalValue(log.dateTime),
            rating: String(log.rating),
            difficulty: String(log.difficulty),
            totalTime: String(log.totalTime),
            totalDistance: String(log.totalDistance),
            comment: log.comment
          });
          this.editLogForm.markAsPristine();
          this.allowRouteChange = true;
          void this.router.navigate(['/tour-logs', log.id]);
        },
        error: () => {
          this.saveError.set('Tour log could not be updated.');
        }
      });
  }

  protected confirmLeave(): void {
    this.showLeaveDialog = false;
    this.pendingLeaveResolver?.(true);
    this.pendingLeaveResolver = null;
  }

  protected stayOnPage(): void {
    this.showLeaveDialog = false;
    this.pendingLeaveResolver?.(false);
    this.pendingLeaveResolver = null;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.allowRouteChange) {
      this.allowRouteChange = false;
      return true;
    }

    if (this.pendingLeaveResolver) {
      return false;
    }

    if (!this.editLogForm.dirty) {
      return true;
    }

    this.showLeaveDialog = true;

    return new Promise<boolean>((resolve) => {
      this.pendingLeaveResolver = resolve;
    });
  }

  private toDateTimeLocalValue(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
