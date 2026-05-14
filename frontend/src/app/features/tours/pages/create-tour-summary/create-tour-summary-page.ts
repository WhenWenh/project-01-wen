import { afterNextRender, Component, inject } from '@angular/core';
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
import { TourApiService } from '../../services/tour-api.service';

@Component({
  selector: 'app-create-tour-summary-page',
  standalone: true,
  imports: [AppShellComponent, ConfirmDialogComponent],
  templateUrl: './create-tour-summary-page.html',
  styleUrl: './create-tour-summary-page.css'
})
export class CreateTourSummaryPage implements PendingChangesAware {
  protected readonly maxDescriptionLength = 500;
  protected readonly draftService = inject(CreateTourDraftService);
  protected isLoggingOut = false;
  protected isSaving = false;
  protected showLeaveDialog = false;
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly tourApi = inject(TourApiService);
  private readonly flowService = inject(CreateTourFlowService);
  private pendingLeaveResolver: ((value: boolean) => void) | null = null;
  private allowRouteChange = false;

  constructor() {
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

  protected editTour(): void {
    this.allowRouteChange = true;
    void this.router.navigateByUrl('/tours/create/details');
  }

  protected saveTour(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.draftService.setSaveResult(null);

    this.tourApi
      .create({
        name: this.draft.name,
        description: this.draft.description,
        imagePath: '',
        tourType: this.draft.tourType as TourType,
        startName: this.draft.from,
        endName: this.draft.to
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (tour) => {
          this.draftService.setSaveResult({
            status: 'success',
            title: 'Tour successfully created!',
            message: 'Your tour has been stored and is ready for the next steps.',
            tourId: tour.id
          });
          this.draftService.reset();
          this.allowRouteChange = true;
          void this.router.navigateByUrl('/tours/create/done');
        },
        error: () => {
          this.draftService.setSaveResult({
            status: 'error',
            title: 'Tour could not be created',
            message: 'Saving failed. Please review the data or try again.'
          });
          this.allowRouteChange = true;
          void this.router.navigateByUrl('/tours/create/done');
        }
      });
  }

  protected get draft() {
    return this.draftService.draft();
  }

  protected get descriptionLength(): number {
    return this.draft.description.length;
  }

  protected tourTypeLabel(value: TourType | ''): string {
    switch (value) {
      case 'BIKE':
        return 'Bike';
      case 'HIKE':
        return 'Hike';
      case 'RUNNING':
        return 'Running';
      case 'VACATION':
        return 'Vacation';
      default:
        return '';
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
