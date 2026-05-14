import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { CreateTourFlowService } from '../../../tours/services/create-tour-flow.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [ButtonModule, AppShellComponent],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPage {
  protected isLoggingOut = false;
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly createTourFlow = inject(CreateTourFlowService);

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

  protected openNewTour(): void {
    this.createTourFlow.startFlow();
    void this.router.navigateByUrl('/tours/create/details');
  }
}
