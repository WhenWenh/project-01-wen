import { afterNextRender, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CreateTourSaveResult } from '../../models/tour.models';
import { CreateTourDraftService } from '../../services/create-tour-draft.service';
import { CreateTourFlowService } from '../../services/create-tour-flow.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { AuthApiService } from '../../../auth/services/auth-api.service';

@Component({
  selector: 'app-create-tour-done-page',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './create-tour-done-page.html',
  styleUrl: './create-tour-done-page.css'
})
export class CreateTourDonePage {
  protected isLoggingOut = false;
  private readonly draftService = inject(CreateTourDraftService);
  private readonly flowService = inject(CreateTourFlowService);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);

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

  protected get result(): CreateTourSaveResult {
    return (
      this.draftService.saveResult() ?? {
        status: 'error',
        title: 'Tour could not be created',
        message: 'No save result is available for this flow.'
      }
    );
  }

  protected goToDashboard(): void {
    this.flowService.resetFlow();
    this.draftService.setSaveResult(null);
    void this.router.navigateByUrl('/dashboard');
  }

  protected goToPrimaryDestination(): void {
    const result = this.result;
    const status = result.status;

    if (status === 'success') {
      this.flowService.resetFlow();
    }

    this.draftService.setSaveResult(null);

    if (status === 'success') {
      void this.router.navigate(['/tours', result.tourId]);
      return;
    }

    void this.router.navigateByUrl('/tours/create/summary');
  }
}
