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
import { TourLogApiService } from '../../services/tour-log-api.service';
import { TourResponse } from '../../../tours/models/tour.models';
import { TourApiService } from '../../../tours/services/tour-api.service';

@Component({
  selector: 'app-create-log-from-logs-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    AppShellComponent,
    ConfirmDialogComponent,
    PageBreadcrumbComponent
  ],
  templateUrl: './create-log-from-logs-page.html',
  styleUrl: './create-log-from-logs-page.css'
})
export class CreateLogFromLogsPage implements PendingChangesAware {
  protected readonly minDateTime = '1900-01-01T00:00';
  protected readonly maxDateTime = '9999-12-31T23:59';
  protected readonly maxCommentLength = 500;
  protected readonly createLogForm;
  protected readonly isLoadingTour = signal(true);
  protected readonly loadError = signal('');
  protected readonly loadedTour = signal<TourResponse | null>(null);
  protected readonly breadcrumbItems = signal<MenuItem[]>([
    { label: 'Tour Logs', routerLink: '/tour-logs' },
    { label: 'Select Tour', routerLink: '/tour-logs/select-tour' },
    { label: 'Create Tour Log' }
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
  private readonly tourApi = inject(TourApiService);
  private pendingLeaveResolver: ((value: boolean) => void) | null = null;
  private allowRouteChange = false;

  constructor() {
    this.createLogForm = this.formBuilder.nonNullable.group({
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

    const tourId = this.route.snapshot.paramMap.get('tourId');

    if (!tourId) {
      this.loadError.set('Tour ID is missing.');
      this.isLoadingTour.set(false);
      return;
    }

    this.tourApi
      .getById(tourId)
      .pipe(finalize(() => this.isLoadingTour.set(false)))
      .subscribe({
        next: (tour) => {
          this.loadedTour.set(tour);
          this.saveError.set('');
          this.breadcrumbItems.set([
            { label: 'Tour Logs', routerLink: '/tour-logs' },
            { label: 'Select Tour', routerLink: '/tour-logs/select-tour' },
            { label: tour.name || tour.id }
          ]);
        },
        error: () => {
          this.loadError.set('Tour details could not be loaded.');
          this.loadedTour.set(null);
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
    if (this.createLogForm.dirty) {
      this.showLeaveDialog = true;
      this.pendingLeaveResolver = (confirmed) => {
        if (confirmed) {
          void this.router.navigateByUrl('/tour-logs/select-tour');
        }
      };
      return;
    }

    void this.router.navigateByUrl('/tour-logs/select-tour');
  }

  protected showDateTimeFormatError(): boolean {
    const control = this.createLogForm.controls.dateTime;
    return control.touched && !control.hasError('required') && control.hasError('pattern');
  }

  protected showRequiredError(
    controlName: 'dateTime' | 'rating' | 'difficulty' | 'totalTime' | 'totalDistance' | 'comment'
  ): boolean {
    const control = this.createLogForm.controls[controlName];
    return control.touched && control.hasError('required');
  }

  protected showRangeError(controlName: 'rating' | 'difficulty'): boolean {
    const control = this.createLogForm.controls[controlName];
    return control.touched && (control.hasError('min') || control.hasError('max'));
  }

  protected showDistanceError(): boolean {
    const control = this.createLogForm.controls.totalDistance;
    return control.touched && (control.hasError('min') || control.hasError('pattern'));
  }

  protected get commentLength(): number {
    return this.createLogForm.controls.comment.value.length;
  }

  protected get isCommentTooLong(): boolean {
    const control = this.createLogForm.controls.comment;
    return control.touched && control.hasError('maxlength');
  }

  protected saveLog(): void {
    const tourId = this.route.snapshot.paramMap.get('tourId');

    this.createLogForm.markAllAsTouched();
    this.saveError.set('');

    if (!tourId || this.createLogForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;

    this.tourLogApi
      .create({
        tourId,
        dateTime: new Date(this.createLogForm.controls.dateTime.value).toISOString(),
        rating: Number(this.createLogForm.controls.rating.value),
        difficulty: Number(this.createLogForm.controls.difficulty.value),
        totalTime: Number(this.createLogForm.controls.totalTime.value),
        totalDistance: Number(this.createLogForm.controls.totalDistance.value),
        comment: this.createLogForm.controls.comment.value.trim()
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.createLogForm.markAsPristine();
          this.allowRouteChange = true;
          void this.router.navigateByUrl('/tour-logs');
        },
        error: () => {
          this.saveError.set('Tour log could not be created.');
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

    if (!this.createLogForm.dirty) {
      return true;
    }

    this.showLeaveDialog = true;

    return new Promise<boolean>((resolve) => {
      this.pendingLeaveResolver = resolve;
    });
  }
}
