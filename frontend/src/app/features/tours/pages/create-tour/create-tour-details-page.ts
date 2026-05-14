import { afterNextRender, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { PendingChangesAware } from '../../../../core/guards/pending-changes.guard';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourType } from '../../models/tour.models';
import { CreateTourDraftService } from '../../services/create-tour-draft.service';
import { CreateTourFlowService } from '../../services/create-tour-flow.service';

@Component({
  selector: 'app-create-tour-details-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppShellComponent, ConfirmDialogComponent],
  templateUrl: './create-tour-details-page.html',
  styleUrl: './create-tour-details-page.css'
})
export class CreateTourDetailsPage implements PendingChangesAware {
  protected readonly maxDescriptionLength = 500;
  protected readonly detailsForm;
  protected isLoggingOut = false;
  protected showLeaveDialog = false;
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly draftService = inject(CreateTourDraftService);
  private readonly flowService = inject(CreateTourFlowService);
  private pendingLeaveResolver: ((value: boolean) => void) | null = null;
  private allowRouteChange = false;

  constructor() {
    const draft = this.draftService.draft();
    this.draftService.setSaveResult(null);

    this.detailsForm = this.formBuilder.nonNullable.group({
      name: [draft.name, [Validators.required]],
      tourType: [draft.tourType, [Validators.required]],
      from: [draft.from, [Validators.required]],
      to: [draft.to, [Validators.required]],
      description: [
        draft.description,
        [Validators.required, Validators.maxLength(this.maxDescriptionLength)]
      ]
    });

    afterNextRender(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

  protected confirmLeave(): void {
    this.flowService.resetFlow();
    this.draftService.reset();
    this.showLeaveDialog = false;
    this.pendingLeaveResolver?.(true);
    this.pendingLeaveResolver = null;
  }

  protected stayOnPage(): void {
    this.showLeaveDialog = false;
    this.pendingLeaveResolver?.(false);
    this.pendingLeaveResolver = null;
  }

  protected cancelCreation(): void {
    this.flowService.resetFlow();
    void this.router.navigateByUrl('/dashboard');
  }

  protected goToSummary(): void {
    this.detailsForm.markAllAsTouched();

    if (this.detailsForm.invalid) {
      return;
    }

    this.draftService.update(this.detailsForm.getRawValue());
    this.allowRouteChange = true;
    void this.router.navigateByUrl('/tours/create/summary');
  }

  protected get descriptionLength(): number {
    return this.detailsForm.controls.description.value.length;
  }

  protected get isDescriptionTooLong(): boolean {
    return this.descriptionLength > this.maxDescriptionLength;
  }

  protected showRequiredError(
    controlName: 'name' | 'tourType' | 'from' | 'to' | 'description'
  ): boolean {
    const control = this.detailsForm.controls[controlName];

    return control.touched && control.hasError('required');
  }

  protected tourTypeLabel(value: TourType): string {
    switch (value) {
      case 'BIKE':
        return 'Bike';
      case 'HIKE':
        return 'Hike';
      case 'RUNNING':
        return 'Running';
      case 'VACATION':
        return 'Vacation';
    }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.allowRouteChange) {
      this.allowRouteChange = false;
      return true;
    }

    if (this.pendingLeaveResolver) {
      return false;
    }

    this.showLeaveDialog = true;

    return new Promise<boolean>((resolve) => {
      this.pendingLeaveResolver = resolve;
    });
  }
}
