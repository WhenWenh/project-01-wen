import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageBreadcrumbComponent } from '../../../../shared/components/page-breadcrumb/page-breadcrumb';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourLogResponse } from '../../models/tour-log.models';
import { TourLogApiService } from '../../services/tour-log-api.service';

@Component({
  selector: 'app-log-details-page',
  standalone: true,
  imports: [ButtonModule, AppShellComponent, ConfirmDialogComponent, PageBreadcrumbComponent],
  templateUrl: './log-details-page.html',
  styleUrl: './log-details-page.css'
})
export class LogDetailsPage {
  protected isLoggingOut = false;
  protected readonly isLoadingLog = signal(true);
  protected readonly loadError = signal('');
  protected readonly log = signal<TourLogResponse | null>(null);
  protected readonly showDeleteDialog = signal(false);
  protected readonly isDeletingLog = signal(false);
  protected readonly breadcrumbItems = signal<MenuItem[]>([
    { label: 'Tour Logs', routerLink: '/tour-logs' },
    { label: 'Log Details' }
  ]);

  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tourLogApi = inject(TourLogApiService);

  constructor() {
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
          this.log.set(log);
          this.breadcrumbItems.set([
            { label: 'Tour Logs', routerLink: '/tour-logs' },
            { label: log.id }
          ]);
        },
        error: () => {
          this.loadError.set('Log details could not be loaded.');
          this.log.set(null);
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
    void this.router.navigateByUrl('/tour-logs');
  }

  protected openEditLog(): void {
    const selectedLog = this.log();

    if (!selectedLog) {
      return;
    }

    void this.router.navigate(['/tour-logs', selectedLog.id, 'edit']);
  }

  protected openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
  }

  protected closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
  }

  protected confirmDeleteLog(): void {
    const selectedLog = this.log();

    if (!selectedLog || this.isDeletingLog()) {
      return;
    }

    this.isDeletingLog.set(true);

    this.tourLogApi
      .deleteById(selectedLog.id)
      .pipe(finalize(() => this.isDeletingLog.set(false)))
      .subscribe({
        next: () => {
          this.showDeleteDialog.set(false);
          void this.router.navigateByUrl('/tour-logs');
        },
        error: () => {
          this.showDeleteDialog.set(false);
        }
      });
  }

  protected formatLogDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  protected formatDistance(distanceInKm: number): string {
    return `${distanceInKm} km`;
  }

  protected formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    if (minutes === 0) {
      return `${hours} h`;
    }

    return `${hours} h ${minutes} min`;
  }
}
